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
}` }} />
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var t=localStorage.getItem('xentral-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();" }} />
      </head>
      <body style={{ margin: 0, background: "var(--surface-page)", color: "var(--ink)", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
