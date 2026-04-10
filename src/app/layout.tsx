import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTGAuto Deck Builder",
  description: "MVP deck builder for Magic: The Gathering"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
