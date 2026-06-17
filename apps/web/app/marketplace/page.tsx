"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, KPICard, StatusBadge, EmptyState, type BadgeTone } from "@xentral/ui";
import { listMarketLeads, getMarketCategories, getRegions, type LeadQuality } from "@xentral/module-marketplace";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const QUALITY: Record<LeadQuality, { label: string; tone: BadgeTone }> = {
  hot: { label: "🔥 Hot", tone: "critical" },
  warm: { label: "Warm", tone: "warning" },
  standard: { label: "Standard", tone: "neutral" },
};

function Channels({ l }: { l: { phone: boolean; whatsapp: boolean; email: boolean; linkedin: boolean } }) {
  const items: [boolean, string, string][] = [[l.phone, "☎", "Phone"], [l.whatsapp, "✆", "WhatsApp"], [l.email, "@", "Email"], [l.linkedin, "in", "LinkedIn"]];
  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      {items.map(([on, g, t]) => (
        <span key={t} title={t + (on ? " available" : " not available")} style={{ width: 22, height: 22, borderRadius: 6, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: on ? color.brand.primaryTint : color.surface.sunken, color: on ? color.brand.primary : color.ink.soft, opacity: on ? 1 : 0.5 }}>{g}</span>
      ))}
    </span>
  );
}

const CREDITS = 999;

export default function MarketplacePage() {
  const ALL = listMarketLeads();
  const cats = getMarketCategories();
  const regions = getRegions();
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const [region, setRegion] = React.useState("all");

  const rows = ALL.filter((l) =>
    (cat === "all" || l.category === cat) &&
    (region === "all" || l.region === region) &&
    (l.specialty + l.summary + l.location).toLowerCase().includes(q.toLowerCase())
  );
  const avg = ALL.length ? Math.round(ALL.reduce((s, l) => s + l.price, 0) / ALL.length) : 0;
  const hot = ALL.filter((l) => l.quality === "hot").length;

  return (
    <AppShell active="marketplace" headerRight={
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: color.brand.primary, background: color.brand.primaryTint, borderRadius: 8, padding: "5px 11px" }}>● {aed(CREDITS)} credits</span>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>MF</span>
      </span>
    }>
      <PageTitleRow title="Marketplace" subtitle="Buy qualified UAE leads — prices drop over time until claimed" actions={<Button variant="primary">Top up credits</Button>} />

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Available leads" value={String(ALL.length)} note="live now" noteTone={color.ink.soft} />
        <KPICard label="Hot leads" value={String(hot)} note="high intent" noteTone={color.status.critical} />
        <KPICard label="Avg price" value={aed(avg)} note="per lead" noteTone={color.ink.soft} />
        <KPICard label="Your credits" value={aed(CREDITS)} note="wallet balance" noteTone={color.status.positive} />
      </div>

      <FilterBar>
        <Input placeholder="Search leads…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ height: 32, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, padding: "0 10px" }}>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ height: 32, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, padding: "0 10px" }}>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No leads match your filters" hint="Try a different category, emirate or search." action={<Button variant="primary" onClick={() => { setQ(""); setCat("all"); setRegion("all"); }}>Clear filters</Button>} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, marginTop: 8 }}>
          {rows.map((l) => {
            const qd = QUALITY[l.quality];
            const off = Math.round((1 - l.price / l.basePrice) * 100);
            return (
              <div key={l.id} style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <StatusBadge tone={qd.tone} label={qd.label} />
                  <span style={{ fontSize: 11.5, color: color.ink.soft }}>{l.postedAgo}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: color.ink.DEFAULT, lineHeight: "20px" }}>{l.specialty}</div>
                <div style={{ fontSize: 12, color: color.ink.soft }}>{l.location} · {cats.find((c) => c.id === l.category)?.label}</div>
                <div style={{ fontSize: 13, color: color.ink.mid, lineHeight: "19px", minHeight: 38 }}>{l.summary}</div>
                <Channels l={l} />
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4, paddingTop: 10, borderTop: `1px solid ${color.line.DEFAULT}` }}>
                  <span>
                    <span style={{ fontSize: 19, fontWeight: 700, color: color.ink.DEFAULT }}>{aed(l.price)}</span>
                    {off > 0 ? <span style={{ fontSize: 12, color: color.ink.soft, textDecoration: "line-through", marginLeft: 6 }}>{aed(l.basePrice)}</span> : null}
                    {off > 0 ? <span style={{ fontSize: 11, fontWeight: 600, color: color.status.positive, marginLeft: 6 }}>−{off}%</span> : null}
                  </span>
                  <Button variant="primary">Buy with credits</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Lead marketplace · @xentral/module-marketplace · seeded (no real PII) · tokens-only, theme-aware</p>
    </AppShell>
  );
}
