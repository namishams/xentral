import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Xentral — Modular Build Console",
  description: "Live view of the modular rebuild (next.xentral.ae).",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind Play CDN — preview/staging only, so the locked utility classes render */}
        <script src="https://cdn.tailwindcss.com" />
      </head>
      <body style={{ margin: 0, background: "#f5f6f7", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
