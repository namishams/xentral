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

function Card({ l, onBuy, busy, watched, onWatch, onBid }: { l: MarketLead; onBuy: (id: string) => void; busy: boolean; watched: boolean; onWatch: (id: string) => void; onBid: (id: string) => void }) {
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
          <button onClick={() => onWatch(l.id)} aria-label="Watch" title={watched ? "Watching" : "Add to watchlist"} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${watched ? color.status.negative : color.line.strong}`, background: watched ? "#fdecea" : color.surface.card, display: "flex", alignItems: "center", justifyContent: "center", color: watched ? color.status.negative : color.ink.soft, cursor: "pointer", fontSize: 15 }}>{watched ? "♥" : "♡"}</button>
          <button onClick={() => onBid(l.id)} style={{ flex: 1, height: 36, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>💬 Make offer</button>
        </div>
        <button onClick={() => onBuy(l.id)} disabled={busy} style={{ height: 46, borderRadius: 9, border: 0, background: busy ? color.line.strong : color.brand.primary, color: color.ink.onPrimary, fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>{busy ? "Processing…" : `Buy — ${aed(l.price)}`}</button>
      </div>
    </div>
  );
}

const FILTERS: [string, string][] = [["all", "All"], ["hot", "🔥 Hot"], ["warm", "⚡ Warm"], ["standard", "Standard"]];
type Saved = { id: string; name: string; category: string; region: string; quality: string; sort: string };

export function MarketplaceClient({ initialRows }: { initialRows: MarketLead[] }) {
  const ALL = initialRows;
  const [busyId, setBusyId] = React.useState("");
  const [bought, setBought] = React.useState<Set<string>>(new Set());
  const [watched, setWatched] = React.useState<Set<string>>(new Set());
  const [saved, setSaved] = React.useState<Saved[]>([]);
  const [msg, setMsg] = React.useState("");
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const [seg, setSeg] = React.useState("all");
  const [onlyWatched, setOnlyWatched] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/marketplace/watchlist").then((r) => r.json()).then((d) => setWatched(new Set(Array.isArray(d.ids) ? d.ids : []))).catch(() => {});
    fetch("/api/marketplace/saved-searches").then((r) => r.json()).then((d) => setSaved(Array.isArray(d.rows) ? d.rows : [])).catch(() => {});
  }, []);

  async function buy(id: string) {
    setBusyId(id); setMsg("");
    try {
      const res = await fetch(`/api/marketplace/${id}/buy`, { method: "POST" });
      const d = await res.json();
      if (res.ok && d.success) { setBought((b) => { const n = new Set(b); n.add(id); return n; }); setMsg(`✓ Lead purchased for AED ${d.pricePaid} · ${d.creditsRemaining} credits left.`); }
      else if (d.error === "insufficient_credits") setMsg(`Not enough credits — this lead needs AED ${d.required}.`);
      else setMsg(d.message || d.error || "Could not purchase.");
    } catch { setMsg("Network error — please try again."); } finally { setBusyId(""); }
  }
  async function toggleWatch(id: string) {
    setWatched((w) => { const n = new Set(w); if (n.has(id)) n.delete(id); else n.add(id); return n; }); // optimistic
    try { const r = await fetch(`/api/marketplace/${id}/watch`, { method: "POST" }); const d = await r.json(); if (typeof d.watched === "boolean") setWatched((w) => { const n = new Set(w); if (d.watched) n.add(id); else n.delete(id); return n; }); } catch { /* revert silently */ }
  }
  async function makeOffer(id: string) {
    const v = window.prompt("Your offer (AED) for this lead:");
    if (!v) return;
    const amount = Number(v.replace(/[^\d.]/g, ""));
    if (!amount) { setMsg("Enter a valid amount."); return; }
    try { const r = await fetch(`/api/marketplace/${id}/bid`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) }); const d = await r.json(); setMsg(r.ok ? `✓ Offer of AED ${amount.toLocaleString()} submitted.` : (d.error || "Could not submit offer.")); } catch { setMsg("Network error."); }
  }
  async function saveSearch() {
    const name = window.prompt("Name this saved search:", [cat !== "all" ? cat : null, seg !== "all" ? seg : null].filter(Boolean).join(" · ") || "All leads");
    if (name === null) return;
    try {
      const r = await fetch("/api/marketplace/saved-searches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category: cat === "all" ? "" : cat, quality: seg === "all" ? "" : seg }) });
      if (r.ok) { const d = await fetch("/api/marketplace/saved-searches").then((x) => x.json()); setSaved(d.rows || []); setMsg("✓ Search saved."); }
    } catch { setMsg("Could not save search."); }
  }
  function applySaved(s: Saved) { setCat(s.category || "all"); setSeg(s.quality || "all"); setOnlyWatched(false); }
  async function deleteSaved(id: string) {
    setSaved((l) => l.filter((s) => s.id !== id));
    await fetch(`/api/marketplace/saved-searches/${id}`, { method: "DELETE" }).catch(() => {});
  }

  const cats = getMarketCategories();
  const rows = ALL.filter((l) => (cat === "all" || l.category === cat) && (seg === "all" || l.quality === seg) && (!onlyWatched || watched.has(l.id)) && (l.title + l.categoryLabel + l.city).toLowerCase().includes(q.toLowerCase()));
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
            <span style={{ fontSize: 12.5, color: color.ink.soft }}>{ALL.length} leads</span>
            {watched.size > 0 ? <span style={{ fontSize: 12.5, color: color.status.negative, fontWeight: 600 }}>♥ {watched.size} watched</span> : null}
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 3 }}>Verified leads · Prices drop automatically</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => (window.location.href = "/marketplace/purchases")}>Purchases</Button>
          <Button variant="primary">+ Top up</Button>
        </div>
      </div>

      {saved.length > 0 ? (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase", letterSpacing: 0.4 }}>Saved:</span>
          {saved.map((s) => (
            <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: color.ink.mid, background: color.surface.card, border: `1px solid ${color.line.strong}`, borderRadius: 999, padding: "4px 6px 4px 11px" }}>
              <button onClick={() => applySaved(s)} style={{ border: 0, background: "transparent", color: color.brand.primary, cursor: "pointer", fontWeight: 600, padding: 0 }}>{s.name}</button>
              <button onClick={() => deleteSaved(s.id)} aria-label="Delete saved search" style={{ border: 0, background: "transparent", color: color.ink.soft, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Input placeholder="Search specialty, category, country…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ height: 32, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, padding: "0 10px" }}>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <span style={{ display: "inline-flex", border: `1px solid ${color.line.strong}`, borderRadius: 8, overflow: "hidden" }}>
          {FILTERS.map(([id, lab]) => <button key={id} onClick={() => setSeg(id)} style={{ border: 0, background: seg === id ? color.brand.primaryTint : color.surface.card, color: seg === id ? color.brand.primary : color.ink.mid, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", cursor: "pointer" }}>{lab}</button>)}
        </span>
        <button onClick={() => setOnlyWatched((v) => !v)} style={{ height: 32, borderRadius: 8, border: `1px solid ${onlyWatched ? color.status.negative : color.line.strong}`, background: onlyWatched ? "#fdecea" : color.surface.card, color: onlyWatched ? color.status.negative : color.ink.mid, fontSize: 12.5, fontWeight: 600, padding: "0 12px", cursor: "pointer" }}>{onlyWatched ? "♥ Watchlist" : "♡ Watchlist"}</button>
        <span style={{ flex: 1 }} />
        <Button onClick={saveSearch}>Save search</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {msg ? <div style={{ gridColumn: "1 / -1", background: color.brand.primaryTint, border: `1px solid ${color.brand.primary}`, color: color.brand.primary, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{msg}</div> : null}
        {rows.filter((l) => !bought.has(l.id)).length === 0 ? <div style={{ gridColumn: "1 / -1", textAlign: "center", color: color.ink.soft, fontSize: 13, padding: 30 }}>{onlyWatched ? "No watched leads yet — tap ♡ on a lead to follow it." : "No leads match your filters."}</div> : null}
        {rows.filter((l) => !bought.has(l.id)).map((l) => <Card key={l.id} l={l} onBuy={buy} busy={busyId === l.id} watched={watched.has(l.id)} onWatch={toggleWatch} onBid={makeOffer} />)}
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Lead marketplace · masked preview · watchlist, saved searches, offers & price-drop · tenant-scoped</p>
    </AppShell>
  );
}
