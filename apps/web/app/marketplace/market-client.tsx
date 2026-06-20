"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, Button, Input } from "@xentral/ui";
import { getMarketCategories, type MarketLead, type LeadQuality } from "@xentral/module-marketplace";

const aed = (n: number) => `AED ${Math.round(n).toLocaleString()}`;
const QUALITY: Record<LeadQuality, { label: string; bg: string; fg: string }> = {
  hot: { label: "🔥 Hot", bg: "#fdecea", fg: color.status.negative },
  warm: { label: "⚡ Warm", bg: "#fbe8d4", fg: color.status.critical },
  standard: { label: "✓ Standard", bg: color.surface.sunken, fg: color.ink.mid },
};

type Question = { id: string; question: string; answer: string | null; createdAt: string };
type BidCtx = { bidCount: number; highBid: number; myBid: number | null; myRank: number | null; minBid: number | null; closeAt: string | null; listingType: string | null };
type Bank = { bankName: string; accountName: string; iban: string; swift: string; currency: string; minAmount: number };

/* live dutch-auction calc — drives the per-second countdown + price drop */
function liveCalc(l: MarketLead): { price: number; countdown: string; remainMs: number; atFloor: boolean } {
  if (!l.listedAt || !l.decayInterval) return { price: l.price, countdown: l.dropInLabel, remainMs: 0, atFloor: false };
  const since = Date.now() - new Date(l.listedAt).getTime();
  const drops = Math.floor(since / 3600000 / Math.max(1, l.decayInterval));
  const floor = l.minPrice ?? Math.round(l.basePrice * 0.5);
  const price = Math.max(floor, l.basePrice - drops * l.dropAmount);
  const intervalMs = Math.max(1, l.decayInterval) * 3600000;
  const remainMs = intervalMs - (since % intervalMs);
  const ts = Math.max(0, Math.floor(remainMs / 1000));
  const h = Math.floor(ts / 3600), m = Math.floor((ts % 3600) / 60), s = ts % 60;
  const countdown = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  return { price, countdown, remainMs, atFloor: price <= floor };
}

function Chip({ label, on }: { label: string; on: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 600,
      border: `1px solid ${on ? color.status.positive + "55" : color.line.DEFAULT}`,
      background: on ? "color-mix(in srgb, " + color.status.positive + " 9%, " + color.surface.card + ")" : color.surface.page,
      color: on ? color.status.positive : color.ink.soft, opacity: on ? 1 : 0.55 }}>{on ? "🔓" : "🔒"} {label}</span>
  );
}

function Card({ l, onBuy, busy, watched, onWatch, onBid, onAsk, credits }: { l: MarketLead; onBuy: (l: MarketLead, price: number) => void; busy: boolean; watched: boolean; onWatch: (id: string) => void; onBid: (l: MarketLead) => void; onAsk: (l: MarketLead) => void; credits: number | null }) {
  const q = QUALITY[l.quality];
  const [live, setLive] = React.useState(() => liveCalc(l));
  const [flash, setFlash] = React.useState(false);
  const prev = React.useRef(live.price);
  React.useEffect(() => {
    const tick = () => { const n = liveCalc(l); if (n.price !== prev.current) { setFlash(true); prev.current = n.price; setTimeout(() => setFlash(false), 1100); } setLive(n); };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [l]);
  const price = live.price;
  const off = Math.round((1 - price / l.basePrice) * 100);
  const critical = live.remainMs > 0 && live.remainMs < 60000;
  const urgent = live.remainMs > 0 && live.remainMs < 300000;
  const enough = credits == null || credits >= price;
  const strip = critical ? { bg: "#fdecea", fg: color.status.negative, t: "Price dropping in under 1 minute!" }
    : urgent ? { bg: "#fbe8d4", fg: color.status.critical, t: `Price drops in ${live.countdown} — act fast` }
      : { bg: color.brand.primaryTint, fg: color.brand.primary, t: "⚡ Verified · Dispute protection · Instant unlock" };

  return (
    <div style={{ background: color.surface.card, border: `${flash || critical ? 2 : 1}px solid ${flash ? color.brand.primary : critical ? color.status.negative + "66" : color.line.DEFAULT}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 1px 2px rgba(16,24,40,0.04)", transition: "border-color .3s" }}>
      <div style={{ height: 28, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", fontSize: 11, fontWeight: 600, background: strip.bg, color: strip.fg }}>{critical ? "🔥" : ""}<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{strip.t}</span></div>
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: q.bg, color: q.fg, borderRadius: 6, padding: "3px 8px" }}>{q.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, background: color.brand.primaryTint, color: color.brand.primary, borderRadius: 6, padding: "3px 8px" }}>{l.freshLabel}</span>
            <span style={{ fontSize: 11, color: l.spots <= 1 ? color.status.negative : color.ink.soft, fontWeight: l.spots <= 1 ? 700 : 400 }}>👥 {l.spots <= 1 ? "Last spot!" : `${l.spots} spots`}</span>
          </span>
          <span style={{ fontSize: 11, color: color.ink.soft }}>👁 {l.views}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <span><span style={{ display: "block", fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT }}>{l.title}</span><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: color.ink.soft }}>{l.categoryLabel}</span></span>
          <span style={{ textAlign: "right", fontSize: 12, color: color.ink.soft }}>🌐 {l.region}<br />{l.city}</span>
        </div>
        <div style={{ fontSize: 12, fontStyle: "italic", color: color.ink.mid, lineHeight: "17px", borderLeft: `2px solid ${color.line.DEFAULT}`, paddingLeft: 8 }}>Verified professional lead — contact details revealed after purchase.</div>
        <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, padding: "10px 12px", background: color.surface.page }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: color.ink.soft, marginBottom: 6 }}>🔒 CONTACT PREVIEW</div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginBottom: 3, fontFamily: "monospace" }}>👤 {l.maskedName}</div>
          <div style={{ fontSize: 13, color: color.ink.mid, fontFamily: "monospace" }}>📞 {l.maskedPhone}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
          <Chip label="Phone" on={l.channels.phone} /><Chip label="WhatsApp" on={l.channels.whatsapp} /><Chip label="Email" on={l.channels.email} />
          <Chip label="LinkedIn" on={l.channels.linkedin} /><Chip label="CV" on={l.channels.cv} /><Chip label="DataFlow" on={l.channels.dataflow} />
        </div>
        <div style={{ border: `1px solid ${critical ? color.status.negative + "44" : flash ? color.brand.primary + "55" : color.line.DEFAULT}`, borderRadius: 9, padding: "11px 13px", background: critical ? "#fdecea" : flash ? color.brand.primaryTint : color.surface.page, display: "flex", alignItems: "flex-end", justifyContent: "space-between", transition: ".4s" }}>
          <span>
            <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: color.ink.soft }}>CURRENT PRICE</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: critical ? color.status.negative : flash ? color.brand.primary : color.ink.DEFAULT, fontVariantNumeric: "tabular-nums" }}>{aed(price)}</span>
            {off > 0 ? <span style={{ display: "block", fontSize: 12, color: color.ink.soft }}><span style={{ textDecoration: "line-through" }}>{aed(l.basePrice)}</span> <span style={{ color: color.status.positive, fontWeight: 700 }}>−{off}%</span></span> : <span style={{ display: "block", height: 16 }} />}
          </span>
          {live.atFloor ? (
            <span style={{ textAlign: "right", fontSize: 11, color: color.status.critical, fontWeight: 700 }}>↓ Floor price<br /><span style={{ color: color.ink.soft, fontWeight: 400 }}>Lowest possible</span></span>
          ) : (
            <span style={{ textAlign: "right", fontSize: 12, color: critical ? color.status.negative : color.ink.soft }}>−{aed(l.dropAmount)} in<br /><span style={{ fontWeight: 800, fontSize: 14, color: critical ? color.status.negative : color.ink.DEFAULT, fontVariantNumeric: "tabular-nums" }}>⏱ {live.countdown}</span></span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => onWatch(l.id)} aria-label="Save" title={watched ? "Saved" : "Save to watchlist"} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${watched ? "#df9a00" : color.line.strong}`, background: watched ? "#fff7e6" : color.surface.card, display: "flex", alignItems: "center", justifyContent: "center", color: watched ? "#df9a00" : color.ink.soft, cursor: "pointer", fontSize: 16 }}>{watched ? "★" : "☆"}</button>
          <button onClick={() => onAsk(l)} style={{ height: 36, padding: "0 12px", borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>❓ Ask</button>
          <button onClick={() => onBid(l)} style={{ flex: 1, height: 36, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>💬 Make offer</button>
        </div>
        {enough ? (
          <button onClick={() => onBuy(l, price)} disabled={busy} style={{ height: 46, borderRadius: 10, border: 0, background: busy ? color.line.strong : critical ? color.status.negative : color.brand.primary, color: color.ink.onPrimary, fontSize: 16, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>{busy ? "Processing…" : `Buy — ${aed(price)}`}</button>
        ) : (
          <button onClick={() => onBuy(l, price)} style={{ height: 46, borderRadius: 10, border: `1px solid ${color.status.critical}55`, background: "#fff7ed", color: color.status.critical, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>👛 Top up to buy — need {aed(price - (credits ?? 0))} more</button>
        )}
      </div>
    </div>
  );
}

const FILTERS: [string, string][] = [["all", "All"], ["hot", "🔥 Hot"], ["warm", "⚡ Warm"], ["standard", "Standard"]];
const SORTS: [string, string][] = [["newest", "Newest"], ["price", "Lowest price"], ["discount", "Biggest drop"]];
type Saved = { id: string; name: string; category: string; region: string; quality: string; sort: string };
type Stats = { total: number; hot: number; exclusive: number; avgPrice: number; addedToday: number };

export function MarketplaceClient({ initialRows, startSaved }: { initialRows: MarketLead[]; startSaved?: boolean }) {
  const ALL = initialRows;
  const [busyId, setBusyId] = React.useState("");
  const [bought, setBought] = React.useState<Set<string>>(new Set());
  const [watched, setWatched] = React.useState<Set<string>>(new Set());
  const [saved, setSaved] = React.useState<Saved[]>([]);
  const [msg, setMsg] = React.useState("");
  const [qstr, setQstr] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const [seg, setSeg] = React.useState("all");
  const [region, setRegion] = React.useState("all");
  const [sort, setSort] = React.useState("newest");
  const [onlyWatched, setOnlyWatched] = React.useState(!!startSaved);
  const [credits, setCredits] = React.useState<number | null>(null);
  const [bank, setBank] = React.useState<Bank | null>(null);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [bidLead, setBidLead] = React.useState<MarketLead | null>(null);
  const [askLead, setAskLead] = React.useState<MarketLead | null>(null);
  const [topup, setTopup] = React.useState<{ amount: string; reference: string; sent: boolean } | null>(null);
  const [insufficient, setInsufficient] = React.useState<{ required: number } | null>(null);
  const [confirmLead, setConfirmLead] = React.useState<{ l: MarketLead; price: number } | null>(null);

  const loadCredits = React.useCallback(() => {
    fetch("/api/credits/topup").then((r) => r.json()).then((d) => { setCredits(typeof d.credits === "number" ? d.credits : 0); if (d.bankDetails) setBank(d.bankDetails); }).catch(() => {});
  }, []);
  React.useEffect(() => {
    fetch("/api/marketplace/watchlist").then((r) => r.json()).then((d) => setWatched(new Set(Array.isArray(d.ids) ? d.ids : []))).catch(() => {});
    fetch("/api/marketplace/saved-searches").then((r) => r.json()).then((d) => setSaved(Array.isArray(d.rows) ? d.rows : [])).catch(() => {});
    fetch("/api/marketplace/stats").then((r) => r.json()).then((d) => setStats(d)).catch(() => {});
    loadCredits();
  }, [loadCredits]);

  // Buy is a two-step flow like the old app: click → Confirm Purchase modal
  // (with the 3 mandatory agreements) → Confirm & Buy actually charges.
  function requestBuy(l: MarketLead, price: number) {
    if (credits != null && credits < price) { setInsufficient({ required: price }); return; }
    setConfirmLead({ l, price });
  }
  async function doBuy(id: string) {
    setBusyId(id); setMsg(""); setConfirmLead(null);
    try {
      const res = await fetch(`/api/marketplace/${id}/buy`, { method: "POST" });
      const d = await res.json();
      if (res.ok && d.success) { setBought((b) => { const n = new Set(b); n.add(id); return n; }); setCredits(d.creditsRemaining ?? credits); setMsg(`✓ Lead purchased for ${aed(d.pricePaid)} · ${aed(d.creditsRemaining)} left. Contact unlocked in Purchases.`); }
      else if (d.error === "insufficient_credits") { setCredits(d.credits ?? credits); setInsufficient({ required: d.required ?? 0 }); }
      else setMsg(d.message || d.error || "Could not purchase.");
    } catch { setMsg("Network error — please try again."); } finally { setBusyId(""); }
  }
  async function toggleWatch(id: string) {
    setWatched((w) => { const n = new Set(w); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    try { const r = await fetch(`/api/marketplace/${id}/watch`, { method: "POST" }); const d = await r.json(); if (typeof d.watched === "boolean") setWatched((w) => { const n = new Set(w); if (d.watched) n.add(id); else n.delete(id); return n; }); } catch { /* revert silently */ }
  }
  async function submitTopup() {
    if (!topup) return; const n = Number(String(topup.amount).replace(/[^\d.]/g, ""));
    if (!n || n < (bank?.minAmount ?? 1000)) { setMsg(`Minimum top-up is ${aed(bank?.minAmount ?? 1000)}.`); return; }
    try { const r = await fetch("/api/credits/topup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: n, reference: topup.reference }) }); if (r.ok) setTopup((t) => t ? { ...t, sent: true } : t); } catch { /* noop */ }
  }
  async function saveSearch() {
    const name = window.prompt("Name this saved search:", [cat !== "all" ? cat : null, region !== "all" ? region : null, seg !== "all" ? seg : null].filter(Boolean).join(" · ") || "All leads");
    if (name === null) return;
    try { const r = await fetch("/api/marketplace/saved-searches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category: cat === "all" ? "" : cat, region: region === "all" ? "" : region, quality: seg === "all" ? "" : seg, sort }) }); if (r.ok) { const d = await fetch("/api/marketplace/saved-searches").then((x) => x.json()); setSaved(d.rows || []); } } catch { /* noop */ }
  }
  function applySaved(s: Saved) { setCat(s.category || "all"); setSeg(s.quality || "all"); setRegion(s.region || "all"); setSort(s.sort || "newest"); setOnlyWatched(false); }
  async function deleteSaved(id: string) { setSaved((l) => l.filter((s) => s.id !== id)); await fetch(`/api/marketplace/saved-searches/${id}`, { method: "DELETE" }).catch(() => {}); }

  const cats = getMarketCategories();
  const regions = ["all", ...Array.from(new Set(ALL.map((l) => l.region).filter(Boolean)))];
  let rows = ALL.filter((l) => (cat === "all" || l.category === cat) && (seg === "all" || l.quality === seg) && (region === "all" || l.region === region) && (!onlyWatched || watched.has(l.id)) && (l.title + l.categoryLabel + l.city + l.region).toLowerCase().includes(qstr.toLowerCase()));
  if (sort === "price") rows = [...rows].sort((a, b) => a.price - b.price);
  else if (sort === "discount") rows = [...rows].sort((a, b) => (b.basePrice - b.price) - (a.basePrice - a.price));
  const visible = rows.filter((l) => !bought.has(l.id));
  const hot = stats?.hot ?? ALL.filter((l) => l.quality === "hot").length;

  return (
    <AppShell active="marketplace">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>🏪 Lead Marketplace</h1>
            <span style={{ fontSize: 13, color: color.status.negative, fontWeight: 600 }}>🔥 {hot} hot</span>
            <span style={{ fontSize: 13, color: color.ink.soft }}>{ALL.length} leads</span>
            {watched.size > 0 ? <span style={{ fontSize: 13, color: "#df9a00", fontWeight: 600 }}>★ {watched.size} saved</span> : null}
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 3 }}>Verified leads · Prices drop automatically every interval</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => (window.location.href = "/marketplace/purchases")}>Purchases</Button>
          <Button variant="primary" onClick={() => setTopup({ amount: String(bank?.minAmount ?? 1000), reference: "", sent: false })}>+ Top up</Button>
        </div>
      </div>

      {stats ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
          {[["Available leads", String(stats.total)], ["🔥 Hot", String(stats.hot)], ["Exclusive", String(stats.exclusive)], ["Avg. price", aed(stats.avgPrice)], ["Added today", String(stats.addedToday)]].map(([k, v]) => (
            <div key={k} style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "10px 13px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase" }}>{k}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: color.ink.DEFAULT, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      ) : null}

      {saved.length > 0 ? (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase", letterSpacing: 0.4 }}>Saved searches:</span>
          {saved.map((s) => (
            <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: color.ink.mid, background: color.surface.card, border: `1px solid ${color.line.strong}`, borderRadius: 999, padding: "4px 6px 4px 11px" }}>
              <button onClick={() => applySaved(s)} style={{ border: 0, background: "transparent", color: color.brand.primary, cursor: "pointer", fontWeight: 600, padding: 0 }}>{s.name}</button>
              <button onClick={() => deleteSaved(s.id)} aria-label="Delete saved search" style={{ border: 0, background: "transparent", color: color.ink.soft, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Input placeholder="Search specialty, category, country…" value={qstr} onChange={(e) => setQstr(e.target.value)} style={{ width: 250 }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ height: 32, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, padding: "0 10px" }}>{cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ height: 32, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, padding: "0 10px" }}>{regions.map((r) => <option key={r} value={r}>{r === "all" ? "All regions" : r}</option>)}</select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ height: 32, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, padding: "0 10px" }}>{SORTS.map(([id, lab]) => <option key={id} value={id}>{lab}</option>)}</select>
        <span style={{ display: "inline-flex", border: `1px solid ${color.line.strong}`, borderRadius: 8, overflow: "hidden" }}>
          {FILTERS.map(([id, lab]) => <button key={id} onClick={() => setSeg(id)} style={{ border: 0, background: seg === id ? color.brand.primaryTint : color.surface.card, color: seg === id ? color.brand.primary : color.ink.mid, fontSize: 13, fontWeight: 600, padding: "6px 12px", cursor: "pointer" }}>{lab}</button>)}
        </span>
        <button onClick={() => setOnlyWatched((v) => !v)} style={{ height: 32, borderRadius: 8, border: `1px solid ${onlyWatched ? "#df9a00" : color.line.strong}`, background: onlyWatched ? "#fff7e6" : color.surface.card, color: onlyWatched ? "#b8780a" : color.ink.mid, fontSize: 13, fontWeight: 600, padding: "0 12px", cursor: "pointer" }}>{onlyWatched ? `★ Saved (${watched.size})` : "☆ Saved"}</button>
        <span style={{ flex: 1 }} />
        <Button onClick={saveSearch}>Save search</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {msg ? <div style={{ gridColumn: "1 / -1", background: color.brand.primaryTint, border: `1px solid ${color.brand.primary}`, color: color.brand.primary, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{msg}</div> : null}
        {visible.length === 0 ? <div style={{ gridColumn: "1 / -1", textAlign: "center", color: color.ink.soft, fontSize: 13, padding: 30 }}>{onlyWatched ? "No saved leads yet — tap ☆ on a lead to save it." : "No leads match your filters."}</div> : null}
        {visible.map((l) => <Card key={l.id} l={l} onBuy={requestBuy} busy={busyId === l.id} watched={watched.has(l.id)} onWatch={toggleWatch} onBid={setBidLead} onAsk={setAskLead} credits={credits} />)}
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Lead marketplace · live price-drop timer · saved leads, offers, questions · masked preview · tenant-scoped</p>

      {bidLead ? <BidSlideOver lead={bidLead} onClose={() => setBidLead(null)} onDone={(m) => { setMsg(m); setBidLead(null); }} /> : null}
      {askLead ? <AskSlideOver lead={askLead} onClose={() => setAskLead(null)} /> : null}
      {confirmLead ? <ConfirmPurchaseModal lead={confirmLead.l} price={confirmLead.price} credits={credits} busy={busyId === confirmLead.l.id} onConfirm={() => doBuy(confirmLead.l.id)} onClose={() => setConfirmLead(null)} /> : null}
      {topup ? <TopupModal bank={bank} state={topup} setState={setTopup} onSubmit={submitTopup} onClose={() => { setTopup(null); loadCredits(); }} /> : null}
      {insufficient ? <InsufficientModal required={insufficient.required} credits={credits ?? 0} onTopup={() => { setInsufficient(null); setTopup({ amount: String(bank?.minAmount ?? 1000), reference: "", sent: false }); }} onClose={() => setInsufficient(null)} /> : null}
    </AppShell>
  );
}

/* ── Confirm Purchase modal — must tick all 3 agreements before Confirm & Buy ── */
function ConfirmPurchaseModal({ lead, price, credits, busy, onConfirm, onClose }: { lead: MarketLead; price: number; credits: number | null; busy: boolean; onConfirm: () => void; onClose: () => void }) {
  const [c1, setC1] = React.useState(false); const [c2, setC2] = React.useState(false); const [c3, setC3] = React.useState(false);
  const allChecked = c1 && c2 && c3;
  const after = credits != null ? Math.max(0, credits - price) : null;
  const rowS: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" };
  const ck = (on: boolean, set: (v: boolean) => void, label: string) => (
    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", cursor: "pointer", fontSize: 13, color: color.ink.mid, lineHeight: "17px" }}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
      <span>{label}</span>
    </label>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,24,38,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, background: color.surface.card, borderRadius: 16, boxShadow: "0 30px 70px -18px rgba(16,24,38,0.5)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT, display: "inline-flex", alignItems: "center", gap: 8 }}>🛡 Confirm Purchase</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT }}>{lead.title}</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: color.ink.soft, marginBottom: 10 }}>{lead.categoryLabel} · {lead.region}</div>
          <div style={{ borderTop: `1px solid ${color.line.DEFAULT}`, borderBottom: `1px solid ${color.line.DEFAULT}`, padding: "4px 0", marginBottom: 14 }}>
            <div style={rowS}><span style={{ fontSize: 13, color: color.ink.mid }}>Amount</span><span style={{ fontSize: 20, fontWeight: 800, color: color.ink.DEFAULT }}>{aed(price)}</span></div>
            {after != null ? <div style={rowS}><span style={{ fontSize: 13, color: color.ink.mid }}>Balance after</span><span style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{aed(after)}</span></div> : null}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase", marginBottom: 2 }}>Confirm all to proceed:</div>
          {ck(c1, setC1, "I understand this purchase is final and credits are non-refundable except for invalid contact information.")}
          {ck(c2, setC2, `I authorize deduction of ${aed(price)} from my balance.`)}
          {ck(c3, setC3, "I agree disputes must be filed within 24 hours of purchase.")}
          <div style={{ background: "#fff7ed", border: `1px solid ${color.status.critical}33`, color: color.status.critical, borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 500, margin: "10px 0 16px" }}>⚠ Contact info revealed instantly. Disputes accepted within 24h only.</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 10, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={onConfirm} disabled={!allChecked || busy} style={{ flex: 1, height: 42, borderRadius: 10, border: 0, background: allChecked && !busy ? color.brand.primary : color.line.strong, color: color.ink.onPrimary, fontSize: 14, fontWeight: 700, cursor: allChecked && !busy ? "pointer" : "default" }}>{busy ? "Processing…" : "Confirm & Buy"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Top-up modal — WIO Bank / ICSL FZE transfer details + request ── */
function TopupModal({ bank, state, setState, onSubmit, onClose }: { bank: Bank | null; state: { amount: string; reference: string; sent: boolean }; setState: (s: { amount: string; reference: string; sent: boolean }) => void; onSubmit: () => void; onClose: () => void }) {
  const copy = (v: string) => navigator.clipboard?.writeText(v).catch(() => {});
  const row = (k: string, v: string, mono?: boolean) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ fontSize: 12, color: color.ink.soft }}>{k}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, fontFamily: mono ? "monospace" : undefined }}>{v}</span><button onClick={() => copy(v)} title="Copy" style={{ border: 0, background: "transparent", cursor: "pointer", color: color.ink.soft, fontSize: 13 }}>⧉</button></span>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,24,38,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: color.surface.card, borderRadius: 16, boxShadow: "0 30px 70px -18px rgba(16,24,38,0.5)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>👛 Top up credits</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          {state.sent ? (
            <div style={{ textAlign: "center", padding: "14px 0" }}>
              <div style={{ fontSize: 34 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: color.status.positive, marginTop: 6 }}>Top-up request submitted</div>
              <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 6 }}>Transfer the funds to the account below. We verify your transfer and credit your wallet — usually within a few hours.</div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: color.ink.mid, marginBottom: 14 }}>Credits are settled by bank transfer. Enter the amount, transfer to the account below, and we credit your wallet on confirmation.</div>
          )}
          {bank ? (
            <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 11, padding: "4px 14px", background: color.surface.page, marginBottom: 16 }}>
              {row("Bank", bank.bankName)}{row("Account name", bank.accountName)}{row("IBAN", bank.iban, true)}{row("SWIFT", bank.swift, true)}{row("Currency", bank.currency)}
            </div>
          ) : null}
          {!state.sent ? (
            <>
              <label style={{ fontSize: 11, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase" }}>Amount (AED)</label>
              <div style={{ display: "flex", gap: 7, margin: "6px 0 10px", flexWrap: "wrap" }}>
                {[1000, 2500, 5000, 10000].map((v) => <button key={v} onClick={() => setState({ ...state, amount: String(v) })} style={{ height: 30, padding: "0 11px", borderRadius: 8, border: `1px solid ${Number(state.amount) === v ? color.brand.primary : color.line.strong}`, background: Number(state.amount) === v ? color.brand.primaryTint : color.surface.card, color: Number(state.amount) === v ? color.brand.primary : color.ink.mid, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{aed(v)}</button>)}
              </div>
              <Input type="number" value={state.amount} onChange={(e) => setState({ ...state, amount: e.target.value })} style={{ width: "100%", marginBottom: 10 }} />
              <label style={{ fontSize: 11, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase" }}>Transfer reference (optional)</label>
              <Input value={state.reference} onChange={(e) => setState({ ...state, reference: e.target.value })} placeholder="e.g. your company name on the transfer" style={{ width: "100%", marginTop: 6, marginBottom: 14 }} />
              <button onClick={onSubmit} style={{ width: "100%", height: 44, borderRadius: 10, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Submit top-up request</button>
            </>
          ) : (
            <button onClick={onClose} style={{ width: "100%", height: 44, borderRadius: 10, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

function InsufficientModal({ required, credits, onTopup, onClose }: { required: number; credits: number; onTopup: () => void; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,24,38,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: color.surface.card, borderRadius: 16, boxShadow: "0 30px 70px -18px rgba(16,24,38,0.5)", padding: 22, textAlign: "center" }}>
        <div style={{ fontSize: 32 }}>👛</div>
        <h2 style={{ margin: "8px 0 4px", fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>Not enough credits</h2>
        <div style={{ fontSize: 14, color: color.ink.mid }}>This lead costs <strong style={{ color: color.ink.DEFAULT }}>{aed(required)}</strong>. You have {aed(credits)} — top up <strong style={{ color: color.ink.DEFAULT }}>{aed(Math.max(0, required - credits))}</strong> more to buy it.</div>
        <button onClick={onTopup} style={{ width: "100%", height: 44, borderRadius: 10, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>Top up credits</button>
        <button onClick={onClose} style={{ width: "100%", height: 38, borderRadius: 10, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>Maybe later</button>
      </div>
    </div>
  );
}

/* ── Offer / bid slide-over ── */
function BidSlideOver({ lead, onClose, onDone }: { lead: MarketLead; onClose: () => void; onDone: (msg: string) => void }) {
  const [ctx, setCtx] = React.useState<BidCtx | null>(null);
  const [amount, setAmount] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  React.useEffect(() => {
    fetch(`/api/marketplace/${lead.id}/view`, { method: "POST" }).catch(() => {});
    fetch(`/api/marketplace/${lead.id}/bid`).then((r) => r.json()).then((d) => { setCtx(d); if (d.myBid) setAmount(String(d.myBid)); else if (d.minBid) setAmount(String(d.minBid)); }).catch(() => {});
  }, [lead.id]);
  async function submit() {
    const n = Number(String(amount).replace(/[^\d.]/g, "")); if (!n) { setErr("Enter a valid amount."); return; }
    setBusy(true); setErr("");
    try { const r = await fetch(`/api/marketplace/${lead.id}/bid`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: n, message }) }); const d = await r.json(); if (r.ok && (d.ok || d.success)) onDone(`✓ Offer of ${aed(n)} submitted for ${lead.title}.`); else setErr(d.error || "Could not submit offer."); } catch { setErr("Network error."); } finally { setBusy(false); }
  }
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,24,38,0.45)", display: "flex", justifyContent: "flex-end", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: "92vw", height: "100%", background: color.surface.card, padding: 22, overflowY: "auto", boxShadow: "-8px 0 24px rgba(16,24,38,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>Make an offer</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: 0, background: "transparent", fontSize: 22, color: color.ink.soft, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: color.ink.mid, marginBottom: 14 }}>{lead.title} · {lead.categoryLabel} · {lead.region}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[["Current price", aed(lead.price)], ["Offers placed", String(ctx?.bidCount ?? 0)], ["Highest offer", ctx?.highBid ? aed(ctx.highBid) : "—"], ["Your offer", ctx?.myBid ? `${aed(ctx.myBid)}${ctx.myRank ? ` · #${ctx.myRank}` : ""}` : "—"]].map(([k, v]) => (
            <div key={k} style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, padding: "9px 11px", background: color.surface.page }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase" }}>{k}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
        {ctx?.minBid ? <div style={{ fontSize: 12, color: color.ink.soft, marginBottom: 10 }}>Minimum offer: <strong style={{ color: color.ink.DEFAULT }}>{aed(ctx.minBid)}</strong></div> : null}
        <label style={{ fontSize: 11, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase" }}>Your offer (AED)</label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 12 }} />
        <label style={{ fontSize: 11, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase" }}>Message (optional)</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{ width: "100%", boxSizing: "border-box", marginTop: 4, marginBottom: 14, border: `1px solid ${color.line.strong}`, borderRadius: 9, padding: "8px 11px", fontSize: 13, color: color.ink.DEFAULT, resize: "vertical" }} placeholder="Tell the seller why you're a strong buyer…" />
        {err ? <div style={{ fontSize: 13, color: color.status.negative, marginBottom: 10, fontWeight: 600 }}>{err}</div> : null}
        <button onClick={submit} disabled={busy} style={{ width: "100%", height: 42, borderRadius: 9, border: 0, background: busy ? color.line.strong : color.brand.primary, color: color.ink.onPrimary, fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>{busy ? "Submitting…" : (ctx?.myBid ? "Update offer" : "Submit offer")}</button>
        <p style={{ fontSize: 11, color: color.ink.soft, marginTop: 10 }}>Offers are reviewed by the seller. You're only charged if your offer is accepted.</p>
      </div>
    </div>
  );
}

/* ── Ask-a-question slide-over ── */
function AskSlideOver({ lead, onClose }: { lead: MarketLead; onClose: () => void }) {
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    fetch(`/api/marketplace/${lead.id}/view`, { method: "POST" }).catch(() => {});
    fetch(`/api/marketplace/${lead.id}/questions`).then((r) => r.json()).then((d) => setQuestions(Array.isArray(d.questions) ? d.questions : [])).catch(() => {});
  }, [lead.id]);
  async function submit() {
    if (!text.trim()) return; setBusy(true); setNote("");
    try { const r = await fetch(`/api/marketplace/${lead.id}/questions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text.trim() }) }); const d = await r.json(); if (r.ok && d.success) { setNote("✓ Question sent — the seller will answer shortly."); setText(""); } else setNote(d.error || "Could not send question."); } catch { setNote("Network error."); } finally { setBusy(false); }
  }
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,24,38,0.45)", display: "flex", justifyContent: "flex-end", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: "92vw", height: "100%", background: color.surface.card, padding: 22, overflowY: "auto", boxShadow: "-8px 0 24px rgba(16,24,38,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>Ask about this lead</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: 0, background: "transparent", fontSize: 22, color: color.ink.soft, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: color.ink.mid, marginBottom: 14 }}>{lead.title} · {lead.categoryLabel} · {lead.region}</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${color.line.strong}`, borderRadius: 9, padding: "8px 11px", fontSize: 13, color: color.ink.DEFAULT, resize: "vertical" }} placeholder="e.g. Is the candidate available immediately? Which emirate are they in?" />
        <button onClick={submit} disabled={busy} style={{ width: "100%", marginTop: 10, height: 42, borderRadius: 9, border: 0, background: busy ? color.line.strong : color.brand.primary, color: color.ink.onPrimary, fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>{busy ? "Sending…" : "Send question"}</button>
        {note ? <div style={{ fontSize: 13, fontWeight: 600, color: note.startsWith("✓") ? color.status.positive : color.status.negative, marginTop: 10 }}>{note}</div> : null}
        <div style={{ marginTop: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" }}>Answered questions</div>
        <div style={{ marginTop: 8 }}>
          {questions.length === 0 ? <div style={{ fontSize: 13, color: color.ink.soft, padding: "10px 0" }}>No answered questions yet.</div> :
            questions.map((qq) => (
              <div key={qq.id} style={{ borderTop: `1px solid ${color.line.DEFAULT}`, padding: "10px 0" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>Q: {qq.question}</div>
                {qq.answer ? <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>A: {qq.answer}</div> : null}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
