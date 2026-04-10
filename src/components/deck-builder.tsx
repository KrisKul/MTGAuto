"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CARDS } from "@/data/cards";
import { calculateDeckAnalytics } from "@/lib/deck-analytics";
import { validateDeck } from "@/lib/deck-validation";
import {
  Card,
  Color,
  ConstructedFormat,
  DeckFormat,
  DeckModel,
  Recommendation,
  RecommendationObjective
} from "@/lib/types";

const colors: Color[] = ["W", "U", "B", "R", "G"];

const emptyDeck: Omit<DeckModel, "id" | "createdAt" | "updatedAt"> = {
  name: "New Deck",
  format: "commander",
  constructedFormat: "modern",
  commanderId: null,
  minDeckSize: 99,
  sideboardLimit: 0,
  entries: [],
  sideboard: []
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || `${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function DeckBuilder() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<DeckModel[]>([]);
  const [deck, setDeck] = useState(emptyDeck);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationObjective, setRecommendationObjective] = useState<RecommendationObjective>("balanced");
  const [status, setStatus] = useState("Ready");

  const [filters, setFilters] = useState({
    name: "",
    colors: [] as Color[],
    mvMin: "",
    mvMax: "",
    type: "",
    text: "",
    format: "commander" as "commander" | "modern" | "pioneer" | "standard"
  });

  const analytics = useMemo(() => calculateDeckAnalytics(deck.entries), [deck.entries]);
  const validationIssues = useMemo(
    () =>
      validateDeck({
        format: deck.format,
        constructedFormat: deck.constructedFormat,
        entries: deck.entries,
        commanderId: deck.commanderId,
        minDeckSize: deck.minDeckSize,
        sideboard: deck.sideboard,
        sideboardLimit: deck.sideboardLimit
      }),
    [deck]
  );

  const commanderOptions = useMemo(
    () =>
      CARDS.filter(
        (card) => card.canBeCommander || (card.typeLine.includes("Legendary") && card.typeLine.includes("Creature"))
      ),
    []
  );

  const cardById = useMemo(() => {
    const map = new Map<string, Card>();
    [...CARDS, ...cards].forEach((card) => map.set(card.id, card));
    return map;
  }, [cards]);

  const searchCards = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (typeof value === "string" && value) params.set(key, value);
      });
      if (filters.colors.length) params.set("colors", filters.colors.join(","));
      const commanderIdentity = deck.commanderId
        ? commanderOptions.find((card) => card.id === deck.commanderId)?.colorIdentity.join(",")
        : "";
      if (commanderIdentity) params.set("commanderIdentity", commanderIdentity);

      const data = await fetchJson<{ cards: Card[] }>(`/api/cards?${params.toString()}`);
      setCards(data.cards);
    } catch (error) {
      setStatus(`Card search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [commanderOptions, deck.commanderId, filters]);

  const loadDecks = useCallback(async () => {
    try {
      const data = await fetchJson<{ decks: DeckModel[] }>("/api/decks");
      setDecks(data.decks);
      if (data.decks.length && !activeDeckId) {
        const first = data.decks[0];
        setDeck(first);
        setActiveDeckId(first.id);
      }
    } catch {
      setStatus("Failed to load saved decks.");
    }
  }, [activeDeckId]);

  const loadRecommendations = useCallback(async () => {
    try {
      const data = await fetchJson<{ recommendations: Recommendation[] }>("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: deck.entries,
          commanderId: deck.commanderId,
          format: deck.format,
          constructedFormat: deck.constructedFormat,
          objective: recommendationObjective
        })
      });
      setRecommendations(data.recommendations);
    } catch {
      setRecommendations([]);
    }
  }, [deck.commanderId, deck.constructedFormat, deck.entries, deck.format, recommendationObjective]);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    void searchCards();
  }, [searchCards]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      format: deck.format === "commander" ? "commander" : deck.constructedFormat
    }));
  }, [deck.format, deck.constructedFormat]);

  function addCard(cardId: string) {
    setDeck((current) => {
      const existing = current.entries.find((entry) => entry.cardId === cardId);
      if (existing) {
        return {
          ...current,
          entries: current.entries.map((entry) =>
            entry.cardId === cardId ? { ...entry, quantity: entry.quantity + 1 } : entry
          )
        };
      }

      return { ...current, entries: [...current.entries, { cardId, quantity: 1 }] };
    });
    setStatus("Card added.");
    void fetch("/api/recommendations/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, accepted: true })
    }).catch(() => undefined);
  }

  function setQty(cardId: string, quantity: number) {
    setDeck((current) => ({
      ...current,
      entries: current.entries
        .map((entry) => (entry.cardId === cardId ? { ...entry, quantity } : entry))
        .filter((entry) => entry.quantity > 0)
    }));
  }

  async function saveDeck() {
    try {
      const method = activeDeckId ? "PUT" : "POST";
      const url = activeDeckId ? `/api/decks/${activeDeckId}` : "/api/decks";
      const data = await fetchJson<{ deck: DeckModel }>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deck)
      });
      if (!activeDeckId) setActiveDeckId(data.deck.id);
      setStatus("Deck saved.");
      await loadDecks();
    } catch (error) {
      setStatus(`Save failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function duplicateDeck() {
    if (!activeDeckId) return;
    try {
      await fetchJson(`/api/decks/${activeDeckId}/duplicate`, { method: "POST" });
      setStatus("Deck duplicated.");
      await loadDecks();
    } catch {
      setStatus("Duplicate failed.");
    }
  }

  async function deleteDeck() {
    if (!activeDeckId) return;
    try {
      await fetchJson(`/api/decks/${activeDeckId}`, { method: "DELETE" });
      setStatus("Deck deleted.");
      setActiveDeckId(null);
      setDeck(emptyDeck);
      await loadDecks();
    } catch {
      setStatus("Delete failed.");
    }
  }

  async function importDeck(raw: string) {
    try {
      const parsed = JSON.parse(raw) as Omit<DeckModel, "id" | "createdAt" | "updatedAt">;
      setDeck(parsed);
      setActiveDeckId(null);
      setStatus("Deck imported locally. Click Save to persist.");
    } catch {
      setStatus("Import failed: invalid JSON.");
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-12">
      <section className="panel lg:col-span-4">
        <h2 className="mb-2 text-lg font-semibold">Card Browser</h2>
        <input
          className="mb-2 w-full rounded border p-2"
          placeholder="Search name"
          value={filters.name}
          onChange={(event) => setFilters((f) => ({ ...f, name: event.target.value }))}
        />
        <div className="mb-2 flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              className={`rounded border px-2 py-1 ${filters.colors.includes(color) ? "bg-slate-900 text-white" : ""}`}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  colors: f.colors.includes(color) ? f.colors.filter((c) => c !== color) : [...f.colors, color]
                }))
              }
            >
              {color}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded border p-2"
            placeholder="MV min"
            value={filters.mvMin}
            onChange={(event) => setFilters((f) => ({ ...f, mvMin: event.target.value }))}
          />
          <input
            className="rounded border p-2"
            placeholder="MV max"
            value={filters.mvMax}
            onChange={(event) => setFilters((f) => ({ ...f, mvMax: event.target.value }))}
          />
        </div>
        <select
          className="mt-2 w-full rounded border p-2"
          value={filters.format}
          onChange={(event) =>
            setFilters((f) => ({ ...f, format: event.target.value as "commander" | "modern" | "pioneer" | "standard" }))
          }
        >
          <option value="commander">Commander</option>
          <option value="modern">Modern</option>
          <option value="pioneer">Pioneer</option>
          <option value="standard">Standard</option>
        </select>
        <input
          className="mt-2 w-full rounded border p-2"
          placeholder="Type line"
          value={filters.type}
          onChange={(event) => setFilters((f) => ({ ...f, type: event.target.value }))}
        />
        <input
          className="mt-2 w-full rounded border p-2"
          placeholder="Oracle text"
          value={filters.text}
          onChange={(event) => setFilters((f) => ({ ...f, text: event.target.value }))}
        />
        <div className="mt-3 max-h-[34rem] space-y-2 overflow-auto">
          {cards.map((card) => (
            <article key={card.id} className="rounded border p-2">
              <div className="flex items-start gap-2">
                {card.imageUri ? (
                  <Image src={card.imageUri} alt={card.name} width={56} height={80} className="h-20 w-14 rounded object-cover" />
                ) : (
                  <div className="h-20 w-14 rounded bg-slate-200" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-xs text-slate-600">
                        {card.typeLine} • MV {card.manaValue}
                      </p>
                    </div>
                    <button className="rounded bg-slate-900 px-2 py-1 text-white" onClick={() => addCard(card.id)}>
                      Add
                    </button>
                  </div>
                  {card.cardFaces?.length ? (
                    <p className="mt-1 text-xs text-slate-500">Face pair: {card.cardFaces.map((face) => face.name).join(" // ")}</p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel lg:col-span-4">
        <h2 className="mb-2 text-lg font-semibold">Deck List</h2>
        <div className="space-y-2">
          <input
            className="w-full rounded border p-2"
            value={deck.name}
            onChange={(event) => setDeck((current) => ({ ...current, name: event.target.value }))}
          />
          <select
            className="w-full rounded border p-2"
            value={deck.format}
            onChange={(event) => {
              const nextFormat = event.target.value as DeckFormat;
              setDeck((current) => ({
                ...current,
                format: nextFormat,
                minDeckSize: nextFormat === "constructed" ? 60 : 99,
                sideboardLimit: nextFormat === "constructed" ? 15 : 0
              }));
            }}
          >
            <option value="commander">Commander</option>
            <option value="constructed">60-card Constructed</option>
          </select>
          {deck.format === "constructed" ? (
            <select
              className="w-full rounded border p-2"
              value={deck.constructedFormat}
              onChange={(event) =>
                setDeck((current) => ({ ...current, constructedFormat: event.target.value as ConstructedFormat }))
              }
            >
              <option value="modern">Modern</option>
              <option value="pioneer">Pioneer</option>
              <option value="standard">Standard</option>
            </select>
          ) : null}
          {deck.format === "commander" ? (
            <select
              className="w-full rounded border p-2"
              value={deck.commanderId ?? ""}
              onChange={(event) => setDeck((current) => ({ ...current, commanderId: event.target.value || null }))}
            >
              <option value="">Select commander</option>
              {commanderOptions.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="mt-3 max-h-[30rem] space-y-2 overflow-auto">
          {deck.entries.map((entry) => {
            const card = cardById.get(entry.cardId);
            return (
              <div key={entry.cardId} className="flex items-center justify-between rounded border p-2">
                <span className="text-sm">{card?.name ?? entry.cardId}</span>
                <input
                  className="w-16 rounded border p-1 text-right"
                  type="number"
                  min={0}
                  value={entry.quantity}
                  onChange={(event) => setQty(entry.cardId, Number(event.target.value))}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={() => void saveDeck()}>
            Save
          </button>
          <button className="rounded border px-3 py-2" onClick={() => void duplicateDeck()}>
            Duplicate
          </button>
          <button className="rounded border px-3 py-2" onClick={() => void deleteDeck()}>
            Delete
          </button>
          <button
            className="rounded border px-3 py-2"
            onClick={() => {
              const output = JSON.stringify(deck, null, 2);
              navigator.clipboard.writeText(output);
              setStatus("Deck copied to clipboard.");
            }}
          >
            Export JSON
          </button>
          <button
            className="col-span-2 rounded border px-3 py-2"
            onClick={() => {
              const payload = window.prompt("Paste deck JSON");
              if (payload) void importDeck(payload);
            }}
          >
            Import JSON
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-600">{status}</p>
      </section>

      <section className="space-y-4 lg:col-span-4">
        <div className="panel">
          <h2 className="mb-2 text-lg font-semibold">Analytics</h2>
          <p>Card count: {analytics.cardCount}</p>
          <p>Average MV: {analytics.averageManaValue}</p>
          <p>Mana curve: {Object.entries(analytics.manaCurve).map(([mv, count]) => `${mv}:${count}`).join(" • ") || "n/a"}</p>
          <p>Type breakdown: {Object.entries(analytics.typeBreakdown).map(([type, count]) => `${type}:${count}`).join(" • ") || "n/a"}</p>
          <p>
            Colors: {Object.entries(analytics.colorDistribution)
              .filter(([, count]) => count > 0)
              .map(([color, count]) => `${color}:${count}`)
              .join(" • ") || "n/a"}
          </p>
        </div>

        <div className="panel">
          <h2 className="mb-2 text-lg font-semibold">Validation</h2>
          <ul className="space-y-1 text-sm">
            {validationIssues.length ? (
              validationIssues.map((issue, index) => (
                <li key={index} className={issue.severity === "error" ? "text-red-600" : "text-amber-600"}>
                  {issue.severity.toUpperCase()}: {issue.message}
                </li>
              ))
            ) : (
              <li className="text-emerald-700">No issues detected.</li>
            )}
          </ul>
        </div>

        <div className="panel">
          <h2 className="mb-2 text-lg font-semibold">Recommendations</h2>
          <label className="mb-2 block text-xs text-slate-700">
            Objective
            <select
              className="mt-1 w-full rounded border p-2 text-sm"
              value={recommendationObjective}
              onChange={(event) => setRecommendationObjective(event.target.value as RecommendationObjective)}
            >
              <option value="balanced">Balanced</option>
              <option value="consistency">More Consistent</option>
              <option value="vs_aggro">Beat Aggro</option>
              <option value="budget">Budget-Friendly</option>
            </select>
          </label>
          <div className="space-y-2 text-sm">
            {recommendations.map((recommendation) => {
              const card = cardById.get(recommendation.cardId);
              return (
                <article key={recommendation.cardId} className="rounded border p-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{card?.name ?? recommendation.cardId}</p>
                    <span>Score {recommendation.score}</span>
                  </div>
                  <p className="text-xs text-slate-600">Confidence {(recommendation.confidence * 100).toFixed(0)}%</p>
                  <ul className="list-disc pl-5 text-xs text-slate-600">
                    {recommendation.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  {recommendation.tradeoffs.length > 0 ? (
                    <ul className="mt-1 list-disc pl-5 text-xs text-amber-700">
                      {recommendation.tradeoffs.map((tradeoff) => (
                        <li key={tradeoff}>{tradeoff}</li>
                      ))}
                    </ul>
                  ) : null}
                  <button className="mt-2 rounded border px-2 py-1 text-xs" onClick={() => addCard(recommendation.cardId)}>
                    Add suggestion
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h2 className="mb-2 text-lg font-semibold">Saved Decks</h2>
          <div className="space-y-2 text-sm">
            {decks.map((saved) => (
              <button
                key={saved.id}
                className="block w-full rounded border p-2 text-left"
                onClick={() => {
                  setDeck(saved);
                  setActiveDeckId(saved.id);
                }}
              >
                {saved.name} ({saved.format})
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
