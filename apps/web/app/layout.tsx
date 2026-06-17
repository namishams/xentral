import type { Metadata } from "next";
import "../lib/live-data";
import "../lib/session";

export const metadata: Metadata = {
  title: "Xentral — Modular Build Console",
  description: "Live view of the modular rebuild (next.xentral.ae).",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-32.png", type: "image/png", sizes: "32x32" }, { url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind Play CDN — preview/staging only, so the locked utility classes render */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com" />
        <style dangerouslySetInnerHTML={{ __html: `:root{
--brand-primary:#0064d9;--brand-primary-hover:#0057be;--brand-tint:#e8f1ff;
--shell-bar:#283d50;--shell-alt:#354a5e;
--surface-page:#f5f6f7;--surface-card:#ffffff;--surface-sunken:#eef1f4;
--line:#e5e5e5;--line-strong:#d5dadf;
--ink:#1d2d3e;--ink-mid:#556b82;--ink-soft:#8396a8;--ink-on-primary:#ffffff;
--status-positive:#188918;--status-critical:#df6e0c;--status-negative:#cc1919;--status-info:#0064d9;
}
:root[data-theme="dark"]{
--brand-primary:#4a9eff;--brand-primary-hover:#6cb2ff;--brand-tint:#16243b;
--shell-bar:#0b1220;--shell-alt:#111a2b;
--surface-page:#0b1220;--surface-card:#141d2e;--surface-sunken:#1b2740;
--line:#27324a;--line-strong:#384a66;
--ink:#e7edf6;--ink-mid:#aebccf;--ink-soft:#7e8ea4;--ink-on-primary:#0b1220;
--status-positive:#46c560;--status-critical:#f0944a;--status-negative:#ff6b6b;--status-info:#4a9eff;
}
.xui-tr{transition:background 120ms ease;}
.xui-tr:hover{background:var(--surface-page);}
.xui-panel--i:hover{box-shadow:0 4px 12px rgba(16,24,40,0.10)!important;}
.xui-row-link:hover{background:var(--surface-page);}` }} />
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var t=localStorage.getItem('xentral-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();" }} />
      </head>
      <body style={{ margin: 0, background: "var(--surface-page)", color: "var(--ink)", fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
