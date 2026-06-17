"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, Button, Input } from "@xentral/ui";
import { getMarketCategories, type MarketLead, type LeadQuality } from "@xentral/module-marketplace";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const QUALITY: Record<LeadQuality, { label: string; bg: string; fg: string }> = {
  hot: { label: "🔥 Hot", bg: "#fdecea", fg: color.status.negative },
  warm: { label: "⚡ Warm", bg: "#fbe8d4", fg: color.status.critical },
  standard: { label: "✓ Standard", bg: color.surface.sunken, fg: color.ink.mid },
};

function Chip({ label, on }: { label: string; on: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 600,
      border: `1px solid ${on ? color.status.positive + "55" : color.line.DEFAULT}`,
      background: on ? "color-mix(in srgb, " + color.status.positive + " 10%, " + color.surface.card + ")" : color.surface.page,
      color: on ? color.status.positive : color.ink.soft, opacity: on ? 1 : 0.6 }}>⌁ {label}</span>
  );
}

function Card({ l }: { l: MarketLead }) {
  const q = QUALITY[l.quality];
  const off = Math.round((1 - l.price / l.basePrice) * 100);
  return (
    <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
      <div style={{ background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11.5, fontWeight: 600, padding: "7px 16px", display: "flex", alignItems: "center", gap: 6 }}>⚡ Verified · Dispute protection · Instant unlock</div>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: q.bg, color: q.fg, borderRadius: 6, padding: "3px 8px" }}>{q.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, background: color.brand.primaryTint, color: color.brand.primary, borderRadius: 6, padding: "3px 8px" }}>{l.freshLabel}</span>
            <span style={{ fontSize: 11.5, color: color.ink.soft }}>👥 {l.spots} spots</span>
          </span>
          <span style={{ fontSize: 11.5, color: color.ink.soft }}>👁 {l.views}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <span><span style={{ display: "block", fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT }}>{l.title}</span><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, color: color.ink.soft }}>{l.categoryLabel}</span></span>
          <span style={{ textAlign: "right", fontSize: 12, color: color.ink.soft }}>🌐 {l.region}<br />{l.city}</span>
        </div>
        <div style={{ fontSize: 12.5, fontStyle: "italic", color: color.ink.mid, lineHeight: "18px" }}>Verified professional lead — contact details revealed after purchase.</div>
        <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, padding: "11px 13px", background: color.surface.page }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: color.ink.soft, marginBottom: 7 }}>🔒 CONTACT PREVIEW</div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginBottom: 4 }}>👤 {l.maskedName}</div>
          <div style={{ fontSize: 13, color: color.ink.mid, fontFamily: "monospace" }}>📞 {l.maskedPhone}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Chip label="Phone" on={l.channels.phone} /><Chip label="WhatsApp" on={l.channels.whatsapp} /><Chip label="Email" on={l.channels.email} />
          <Chip label="LinkedIn" on={l.channels.linkedin} /><Chip label="CV" on={l.channels.cv} /><Chip label="DataFlow" on={l.channels.dataflow} />
        </div>
        <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, padding: "12px 14px", background: color.surface.page, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <span>
            <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: color.ink.soft }}>CURRENT PRICE</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: color.ink.DEFAULT }}>{aed(l.price)}</span>
            {off > 0 ? <span style={{ display: "block", fontSize: 12, color: color.ink.soft }}><span style={{ textDecoration: "line-through" }}>{aed(l.basePrice)}</span> <span style={{ color: color.status.positive, fontWeight: 700 }}>−{off}%</span></span> : null}
          </span>
          <span style={{ textAlign: "right", fontSize: 12, color: color.ink.soft }}>−{aed(l.dropAmount)} in<br /><span style={{ fontWeight: 700, color: color.ink.DEFAULT }}>⏱ {l.dropInLabel}</span><br />at {l.dropAtLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${color.line.strong}`, display: "flex", alignItems: "center", justifyContent: "center", color: color.ink.soft, cursor: "pointer" }}>♡</span>
          <span style={{ flex: 1, height: 34, borderRadius: 8, border: `1px solid ${color.line.strong}`, display: "flex", alignItems: "center", justifyContent: "center", color: color.ink.mid, fontSize: 13, cursor: "pointer" }}>💬 Ask ▾</span>
        </div>
        <button style={{ height: 46, borderRadius: 9, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Buy — {aed(l.price)}</button>
      </div>
    </div>
  );
}

const FILTERS: [string, string][] = [["all", "All"], ["hot", "🔥 Hot"], ["warm", "⚡ Warm"], ["standard", "Standard"]];

export function MarketplaceClient({ initialRows }: { initialRows: MarketLead[] }) {
  const ALL = initialRows;
  const cats = getMarketCategories();
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const [seg, setSeg] = React.useState("all");
  const rows = ALL.filter((l) => (cat === "all" || l.category === cat) && (seg === "all" || l.quality === seg) && (l.title + l.categoryLabel + l.city).toLowerCase().includes(q.toLowerCase()));
  const hot = ALL.filter((l) => l.quality === "hot").length;
  const avg = Math.round(ALL.reduce((s, l) => s + l.price, 0) / ALL.length);

  return (
    <AppShell active="marketplace" headerRight={
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: color.brand.primary, background: color.brand.primaryTint, borderRadius: 8, padding: "5px 11px" }}>◳ AED 999 ＋</span>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>MF</span>
      </span>
    }>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>🏪 Lead Marketplace</h1>
            <span style={{ fontSize: 12.5, color: color.status.negative, fontWeight: 600 }}>🔥 {hot} hot</span>
            <span style={{ fontSize: 12.5, color: color.brand.primary, fontWeight: 600 }}>↘ 72 dropping</span>
            <span style={{ fontSize: 12.5, color: color.ink.soft }}>{ALL.length + 72} leads</span>
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 3 }}>Verified leads · Prices drop automatically</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => (window.location.href = "/marketplace/purchases")}>Purchases</Button>
          <Button variant="primary">+ Top up</Button>
        </div>
      </div>

      <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", fontSize: 12.5, color: color.ink.DEFAULT }}>
          <span>🛡 Contact details verified before listing</span>
          <span>⏱ 24-hour dispute protection on every purchase</span>
          <span>✓ Invalid contacts refunded as credits</span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 9, fontSize: 12, color: color.ink.soft }}>
          <span><b style={{ color: color.ink.DEFAULT }}>2</b> listed today</span>
          <span><b style={{ color: color.ink.DEFAULT }}>72</b> dropping in price</span>
          <span>avg <b style={{ color: color.ink.DEFAULT }}>{aed(avg)}</b></span>
          <span>most listed: <b style={{ color: color.ink.DEFAULT }}>DHA Licensing</b></span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Input placeholder="Search specialty, category, country…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ height: 32, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, padding: "0 10px" }}>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <span style={{ display: "inline-flex", border: `1px solid ${color.line.strong}`, borderRadius: 8, overflow: "hidden" }}>
          {FILTERS.map(([id, lab]) => <button key={id} onClick={() => setSeg(id)} style={{ border: 0, background: seg === id ? color.brand.primaryTint : color.surface.card, color: seg === id ? color.brand.primary : color.ink.mid, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", cursor: "pointer" }}>{lab}</button>)}
        </span>
        <Button>☆ Watchlist</Button>
        <span style={{ flex: 1 }} />
        <Button>Save search</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {rows.map((l) => <Card key={l.id} l={l} />)}
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Lead marketplace · masked preview, channel unlock, price-drop auction · seeded (no real PII) · tokens-only, theme-aware</p>
    </AppShell>
  );
}
