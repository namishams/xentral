"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge, type BadgeTone } from "@xentral/ui";

type Lead = { id: string; name: string; category: string; origin: string; quality: string; price: number; floor: number; status: string; buyers: number; cap: number; kind: string; listed: string };
type Tenant = { id: string; name: string; credits: number; users: number; contacts: number; joined: string; spent: number };
type Topup = { id: string; companyId: string; company: string; balance: number; amount: number; status: string; date: string };
type Demo = { id: string; name: string; email: string; company: string; country: string; useCase: string; status: string; date: string };
type Q = { id: string; question: string; answer: string | null; status: string; company: string; date: string };
type Bid = { id: string; amount: number; status: string; company: string; companyId: string; balance: number; leadId: string; lead: string; kind: string };
type Dispute = { id: string; reason: string; details: string | null; status: string; company: string; date: string; paid: number; purchaseId: string; lead: string };
type Reseller = { id: string; company: string; approved: boolean; rate: number; earned: number; pending: number; paid: number };
type Payout = { id: string; company: string; amount: number; status: string; method: string; date: string };
type NumMap = Record<string, number>;
type Feed = { ok?: boolean; totals?: NumMap; streams?: NumMap; supply?: NumMap; tenants?: Tenant[]; leads?: Lead[]; topups?: Topup[]; demos?: Demo[]; questions?: Q[]; resellers?: Reseller[]; payouts?: Payout[]; bids?: Bid[]; disputes?: Dispute[]; topCustomers?: Tenant[] };

type AddForm = {
  id?: string; name: string; category: string; originCountry: string; originRegion: string; quality: string;
  yearsExperience: string; currentLocation: string; summary: string;
  hasPhone: boolean; hasWhatsApp: boolean; hasEmail: boolean; hasLinkedIn: boolean; hasCV: boolean; hasDataflow: boolean;
  firstName: string; lastName: string; phone: string; email: string; linkedIn: string; notes: string; cvUrl: string; cvName: string;
  listingType: string; minBid: string; reservePrice: string; bidsCloseAt: string;
  initialPrice: string; minPrice: string; decayAmount: string; decayInterval: string; maxPurchases: string; status: string;
};
const blank = (): AddForm => ({
  name: "", category: "Healthcare", originCountry: "", originRegion: "UAE", quality: "STANDARD",
  yearsExperience: "", currentLocation: "", summary: "",
  hasPhone: true, hasWhatsApp: true, hasEmail: true, hasLinkedIn: false, hasCV: false, hasDataflow: false,
  firstName: "", lastName: "", phone: "", email: "", linkedIn: "", notes: "", cvUrl: "", cvName: "",
  listingType: "shared", minBid: "", reservePrice: "", bidsCloseAt: "",
  initialPrice: "50", minPrice: "30", decayAmount: "10", decayInterval: "6", maxPurchases: "3", status: "AVAILABLE",
});

const aed = (n: number) => `AED ${(Number(n) || 0).toLocaleString()}`;
const TABS = ["Overview", "Marketplace", "Bids", "Disputes", "AI Import", "Credits", "Companies", "Questions", "Demo Requests", "Resellers"] as const;
const QTONE: Record<string, BadgeTone> = { AVAILABLE: "positive", SOLD: "neutral", DRAFT: "info", EXPIRED: "critical", HOT: "critical", WARM: "critical", STANDARD: "info" };
const REGIONS = ["UAE", "GCC", "Asia/Africa", "Europe", "Americas", "Unknown"];
const QUALITIES = ["HOT", "WARM", "STANDARD"];
const LISTINGS = [
  { id: "shared", label: "Shared", hint: "Multiple buyers, price drops over time" },
  { id: "exclusive", label: "Exclusive", hint: "1 buyer only, fixed price" },
  { id: "best_offer", label: "Best Offer", hint: "Companies bid, you pick the winner" },
];

export default function AdminPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Overview");
  const [d, setD] = React.useState<Feed>({});
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [mFilter, setMFilter] = React.useState("ALL");
  const [adding, setAdding] = React.useState(false);
  const [f, setF] = React.useState<AddForm>(blank());
  const [imgs, setImgs] = React.useState<string[]>([]);
  const [aiMsg, setAiMsg] = React.useState("");
  const [extracted, setExtracted] = React.useState<Record<string, string | number | boolean> | null>(null);
  const [prefillNote, setPrefillNote] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/console").then((r) => r.json()).then((j) => { setD(j || {}); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  // Prefill the Add-Lead form when arriving from a WhatsApp conversation
  // (Inbox → "List on marketplace"). Opens the Marketplace tab + modal, then —
  // if a conversation id is present — asks the AI to read the chat and fill the rest.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const waName = sp.get("waName"); const waPhone = sp.get("waPhone"); const waConv = sp.get("waConv");
    if (!waName && !waPhone && !waConv) return;
    const parts = (waName || "").trim().split(/\s+/).filter(Boolean);
    setF({ ...blank(), name: waName || "WhatsApp lead", firstName: parts[0] || "", lastName: parts.slice(1).join(" "), phone: waPhone || "", hasWhatsApp: true, hasPhone: !!waPhone });
    setTab("Marketplace");
    setAdding(true);
    window.history.replaceState({}, "", "/admin");
    if (!waConv) return;
    setPrefillNote("✦ Reading the WhatsApp chat to fill the lead…");
    fetch("/api/admin/ai-lead-from-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: waConv }) })
      .then((r) => r.json()).then((j) => {
        if (!j?.lead) { setPrefillNote(j?.error ? `AI: ${j.error}` : ""); return; }
        const x = j.lead as Record<string, string | number | boolean>;
        const sx = (k: string) => (x[k] == null ? "" : String(x[k]));
        const reg = REGIONS.find((r) => r.toLowerCase() === sx("originRegion").toLowerCase()) || "Unknown";
        const qual = QUALITIES.includes(sx("quality").toUpperCase()) ? sx("quality").toUpperCase() : "STANDARD";
        const price = Math.round(Number(x.suggestedPrice) || 50);
        setF((prev) => ({
          ...prev,
          name: sx("specialty") || prev.name,
          category: sx("category") || prev.category,
          originCountry: sx("originCountry") || prev.originCountry,
          originRegion: reg,
          quality: qual,
          currentLocation: sx("currentLocation") || prev.currentLocation,
          summary: sx("summary") || prev.summary,
          firstName: sx("firstName") || prev.firstName,
          lastName: sx("lastName") || prev.lastName,
          phone: sx("phone") || prev.phone,
          email: sx("email") || prev.email,
          notes: sx("notes") || prev.notes,
          hasPhone: prev.hasPhone || !!x.hasPhone,
          hasWhatsApp: true,
          hasEmail: prev.hasEmail || !!x.hasEmail,
          initialPrice: String(price),
          minPrice: String(Math.round(price * 0.6)),
        }));
        setPrefillNote("✦ AI filled this from the WhatsApp chat — review, then choose listing type & price.");
      }).catch(() => setPrefillNote(""));
  }, []);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    try { const r = await fetch("/api/admin/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (!r.ok) window.alert(j.error || "Action failed"); else load(); return r.ok; }
    finally { setBusy(false); }
  }
  const totals = d.totals || {}; const streams = d.streams || {}; const supply = d.supply || {};

  const leads = (d.leads || []).filter((l) => mFilter === "ALL" || l.status === mFilter);
  function openAdd() { setF(blank()); setPrefillNote(""); setAdding(true); }
  function openEdit(l: Lead) {
    setF({ ...blank(), id: l.id, name: l.name, category: l.category, originRegion: l.origin || "UAE", quality: l.quality || "STANDARD",
      initialPrice: String(l.price || 0), minPrice: String(l.floor || 0), maxPurchases: String(l.cap || 1), status: l.status || "AVAILABLE",
      listingType: l.kind === "exclusive" || l.kind === "best_offer" ? l.kind : "shared" });
    setAdding(true);
  }
  const set = (k: keyof AddForm, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  async function saveLead() {
    if (!f.name.trim()) return;
    const body = { kind: f.id ? "mkt.update" : "mkt.add", ...f, isExclusive: f.listingType === "exclusive" };
    if (await act(body)) { setAdding(false); setF(blank()); setPrefillNote(""); }
  }
  async function uploadCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    setBusy(true);
    try {
      const r = await fetch("/api/admin/cv-upload", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) set("cvUrl", j.url), set("cvName", file.name), set("hasCV", true);
      else window.alert(j.error || "Upload failed");
    } finally { setBusy(false); }
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3);
    Promise.all(files.map((file) => new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsDataURL(file); }))).then(setImgs);
  }
  async function runImport() {
    if (!imgs.length) return; setBusy(true); setAiMsg(""); setExtracted(null);
    try {
      const r = await fetch("/api/admin/ai-import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images: imgs }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.lead) { setExtracted(j.lead as Record<string, string | number | boolean>); setAiMsg(""); }
      else setAiMsg(j.error || "Import failed");
    } finally { setBusy(false); }
  }
  // Pre-fill the Add Lead form with the AI-extracted data, then open it so the
  // operator can choose a listing type (shared / exclusive / best offer) and price.
  function useAiData() {
    if (!extracted) return;
    const x = extracted;
    const sx = (k: string) => (x[k] == null ? "" : String(x[k]));
    const reg = (() => { const v = sx("originRegion"); return REGIONS.find((r) => r.toLowerCase() === v.toLowerCase()) || (/eu|europe/i.test(v) ? "Europe" : /gcc/i.test(v) ? "GCC" : /uae|emirat/i.test(v) ? "UAE" : /asia|africa/i.test(v) ? "Asia/Africa" : /america/i.test(v) ? "Americas" : "Unknown"); })();
    const qual = QUALITIES.includes(sx("quality").toUpperCase()) ? sx("quality").toUpperCase() : "STANDARD";
    const price = Math.round(Number(x.suggestedPrice) || 50);
    setF({
      ...blank(),
      name: sx("specialty") || sx("name"),
      category: sx("category") || "Healthcare",
      originCountry: sx("originCountry"),
      originRegion: reg,
      quality: qual,
      currentLocation: sx("currentLocation"),
      summary: sx("summary"),
      firstName: sx("firstName"), lastName: sx("lastName"),
      phone: sx("phone"), email: sx("email"), linkedIn: sx("linkedIn"),
      notes: sx("notes") || sx("summary"),
      hasPhone: !!x.hasPhone, hasWhatsApp: !!x.hasWhatsApp, hasEmail: !!x.hasEmail, hasLinkedIn: !!x.hasLinkedIn, hasCV: !!x.hasCV, hasDataflow: !!x.hasDataflow,
      initialPrice: String(price), minPrice: String(Math.round(price * 0.6)),
    });
    setExtracted(null); setImgs([]); setTab("Marketplace"); setAdding(true);
  }

  const cardS: React.CSSProperties = { border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, background: color.surface.card, overflow: "hidden" };
  const th: React.CSSProperties = { textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", padding: "9px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` };
  const td: React.CSSProperties = { padding: "10px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 13, color: color.ink.DEFAULT };
  const fieldS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 9, padding: "0 11px", fontSize: 14, background: color.surface.card, color: color.ink.DEFAULT, outline: "none" };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, marginBottom: 5 };
  const sec: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: color.brand.primary, margin: "4px 0 2px" };
  const ImgIcon = ({ s = 28 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color.ink.soft} strokeWidth={1.6} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
    </svg>
  );
  const chk = (k: keyof AddForm, label: string) => (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: color.ink.DEFAULT, cursor: "pointer" }}>
      <input type="checkbox" checked={!!f[k]} onChange={(e) => set(k, e.target.checked)} /> {label}
    </label>
  );

  return (
    <AppShell active="admin">
      <PageTitleRow title="Admin Portal" breadcrumb="Xentral · Platform operator" subtitle="Mission Control — marketplace supply, credits & tenants" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Tenants" value={String(totals.tenants ?? 0)} note="workspaces" noteTone={color.brand.primary} />
        <KPICard label="Credits" value={(totals.credits ?? 0).toLocaleString()} note="in circulation" noteTone={color.status.positive} />
        <KPICard label="Leads available" value={String(supply.available ?? 0)} note={`${supply.listed ?? 0} listed`} noteTone={(supply.available ?? 0) > 0 ? color.status.positive : color.status.critical} />
        <KPICard label="Marketplace GMV" value={aed(supply.gmv ?? 0)} note={`${supply.sold ?? 0} sold`} noteTone={color.brand.primary} />
        <KPICard label="Subscriptions" value={String(totals.subsActive ?? 0)} note="active" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${color.line.DEFAULT}`, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const badge = t === "Credits" ? (totals.pendingTopups ?? 0) : t === "Demo Requests" ? (totals.pendingDemos ?? 0) : t === "Questions" ? (totals.openQuestions ?? 0) : t === "Resellers" ? (totals.pendingPayouts ?? 0) : 0;
          return (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 500, color: tab === t ? color.brand.primary : color.ink.mid, padding: "8px 0", borderBottom: tab === t ? `2px solid ${color.brand.primary}` : "2px solid transparent", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {t}{badge > 0 ? <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: color.status.critical, borderRadius: 999, padding: "0 6px", lineHeight: "16px" }}>{badge}</span> : null}
            </button>
          );
        })}
      </div>

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div> : (
        <>
          {tab === "Overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12 }}>
                <KPICard label="Marketplace GMV" value={aed(streams.marketplaceGmv ?? 0)} note="all-time sold" noteTone={color.brand.primary} />
                <KPICard label="Credits outstanding" value={(streams.creditsOutstanding ?? 0).toLocaleString()} note="tenant wallets" noteTone={color.status.positive} />
                <KPICard label="Active subscriptions" value={String(streams.subscriptions ?? 0)} note="paying workspaces" noteTone={color.ink.soft} />
                <KPICard label="Pending top-ups" value={String(totals.pendingTopups ?? 0)} note="awaiting approval" noteTone={(totals.pendingTopups ?? 0) > 0 ? color.status.critical : color.ink.soft} />
                <KPICard label="Open questions" value={String(totals.openQuestions ?? 0)} note="lead Q&A" noteTone={color.ink.soft} />
                <KPICard label="Demo requests" value={String(totals.pendingDemos ?? 0)} note="new" noteTone={color.ink.soft} />
              </div>
              <div style={cardS}>
                <div style={th}>Top customers (by spend)</div>
                {(d.topCustomers || []).filter((t) => t.spent > 0).length === 0 ? <div style={{ padding: 14, fontSize: 13, color: color.ink.soft }}>No marketplace spend yet.</div>
                  : (d.topCustomers || []).filter((t) => t.spent > 0).map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t.name}<span style={{ fontSize: 12, color: color.ink.soft, fontWeight: 400 }}> · {t.users} users</span></span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{aed(t.spent)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {tab === "Marketplace" && (
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                {["ALL", "AVAILABLE", "SOLD", "DRAFT"].map((x) => <button key={x} onClick={() => setMFilter(x)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${mFilter === x ? color.ink.DEFAULT : color.line.strong}`, background: mFilter === x ? color.ink.DEFAULT : color.surface.card, color: mFilter === x ? color.surface.card : color.ink.mid }}>{x}</button>)}
                <span style={{ flex: 1 }} /><span style={{ fontSize: 13, color: color.ink.soft }}>{leads.length} leads</span>
                <Button variant="primary" onClick={openAdd}>+ Add Lead</Button>
              </div>
              <div style={{ ...cardS, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>Lead</th><th style={th}>Category</th><th style={th}>Origin</th><th style={th}>Type</th><th style={{ ...th, textAlign: "right" }}>Price</th><th style={{ ...th, textAlign: "right" }}>Buyers</th><th style={th}>Status</th><th style={{ ...th, textAlign: "right" }}>Actions</th></tr></thead>
                  <tbody>
                    {leads.length === 0 ? <tr><td style={{ ...td, textAlign: "center", color: color.ink.soft }} colSpan={8}>No leads.</td></tr>
                      : leads.map((l) => (
                        <tr key={l.id}>
                          <td style={td}><span style={{ fontWeight: 600 }}>{l.name}</span> <StatusBadge tone={QTONE[l.quality] ?? "info"} label={l.quality} /></td>
                          <td style={td}>{l.category}</td>
                          <td style={td}>{l.origin}</td>
                          <td style={td}><span style={{ fontSize: 12, color: color.ink.soft }}>{l.kind === "best_offer" ? "Best Offer" : l.kind === "exclusive" ? "Exclusive" : "Shared"}</span></td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{aed(l.price)}</td>
                          <td style={{ ...td, textAlign: "right" }}>{l.buyers}/{l.cap}</td>
                          <td style={td}><StatusBadge tone={QTONE[l.status] ?? "neutral"} label={l.status} /></td>
                          <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}><Button onClick={() => openEdit(l)}>Edit</Button> <button onClick={() => { if (confirm("Delete this lead?")) act({ kind: "mkt.delete", id: l.id }); }} disabled={busy} style={{ height: 32, padding: "0 10px", borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.status.negative, cursor: "pointer", fontSize: 13 }}>Delete</button></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "AI Import" && (
            <div style={{ maxWidth: 960 }}>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#0064d9,#22D3A6)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: color.ink.DEFAULT }}>AI Lead Import</span>
              </div>
              <div style={{ fontSize: 14, color: color.ink.mid, marginBottom: 18 }}>Upload up to 3 screenshots — GPT-4 Vision analyses them all together and extracts the lead data automatically.</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                {[0, 1, 2].map((i) => (
                  <button key={i} onClick={() => fileRef.current?.click()} style={{ height: 150, border: `1.5px dashed ${color.line.strong}`, borderRadius: 12, background: imgs[i] ? color.surface.card : color.surface.page, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, overflow: "hidden", padding: 0 }}>
                    {imgs[i]
                      ? <img src={imgs[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <><ImgIcon s={30} /><span style={{ fontSize: 13, color: color.ink.soft }}>{i === 0 ? "Add screenshot" : `Screenshot ${i + 1}`}</span></>}
                  </button>
                ))}
              </div>

              <button onClick={() => fileRef.current?.click()} style={{ width: "100%", border: `1.5px dashed ${color.line.strong}`, borderRadius: 14, background: color.surface.page, padding: "34px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
                <ImgIcon s={40} />
                <span style={{ fontSize: 15, fontWeight: 700, color: color.ink.DEFAULT }}>Drop screenshots here or click to upload</span>
                <span style={{ fontSize: 13, color: color.ink.soft }}>Upload up to 3 screenshots of the same lead for best results</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 8, height: 38, padding: "0 16px", borderRadius: 9, background: color.brand.primaryTint, color: color.brand.primary, fontWeight: 600, fontSize: 13 }}>⬆ Choose Screenshots</span>
              </button>

              {imgs.length > 0 && !extracted && <div style={{ marginTop: 16 }}><Button variant="primary" onClick={runImport} disabled={busy}>{busy ? "Analysing…" : `Analyse ${imgs.length} screenshot${imgs.length > 1 ? "s" : ""}`}</Button> <button onClick={() => { setImgs([]); setAiMsg(""); }} style={{ marginLeft: 8, height: 32, padding: "0 12px", borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, cursor: "pointer", fontSize: 13 }}>Clear</button></div>}
              {aiMsg && <div style={{ marginTop: 14, fontSize: 13, color: color.status.critical }}>{aiMsg}</div>}

              {extracted && (
                <div style={{ marginTop: 18, border: `1px solid ${color.status.positive}`, borderRadius: 14, overflow: "hidden", background: color.surface.card }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: "rgba(34,211,166,0.10)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: color.status.positive }}>✓ Lead Data Extracted Successfully</span>
                    <button onClick={useAiData} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 14px", borderRadius: 9, border: 0, background: color.status.positive, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>＋ Use This Data → Open Form</button>
                  </div>
                  <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                    {Object.entries(extracted).map(([k, v]) => {
                      if (v === null || v === undefined || v === "") return null;
                      const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
                      const isBool = typeof v === "boolean";
                      const disp = isBool ? (v ? "✓ Yes" : "✗ No") : String(v);
                      return (
                        <div key={k} style={{ display: "flex", gap: 8 }}>
                          <span style={{ fontSize: 12, color: color.ink.soft, width: 130, flexShrink: 0 }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isBool ? (v ? color.status.positive : color.ink.soft) : color.ink.DEFAULT }}>{disp}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 14px" }}>
                    <span style={{ fontSize: 12, color: color.ink.soft }}>Review the extracted data, then click “Use This Data” to pre-fill the lead form — choose Shared, Exclusive or Best Offer and set the price there.</span>
                    <button onClick={() => { setExtracted(null); setImgs([]); setAiMsg(""); }} style={{ flexShrink: 0, marginLeft: 14, height: 30, padding: "0 12px", borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, cursor: "pointer", fontSize: 12 }}>Start Over</button>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 24 }}>
                {[["📱", "WhatsApp Screenshot", "Capture the conversation showing contact info and their interest in UAE licensing."],
                  ["📧", "Email Screenshot", "Screenshot an inquiry email — name, email address, and request visible."],
                  ["💼", "LinkedIn Message", "Screenshot a DM from a professional seeking UAE licensing or career help."]].map(([icon, title, desc]) => (
                  <div key={title} style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, background: color.surface.card, padding: 16 }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: color.ink.soft, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Credits" && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
              <div style={cardS}>
                <div style={th}>Top-up requests</div>
                {(d.topups || []).length === 0 ? <div style={{ padding: 14, fontSize: 13, color: color.ink.soft }}>No requests.</div>
                  : (d.topups || []).map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                      <div><div style={{ fontWeight: 600, fontSize: 13 }}>{t.company || "—"}</div><div style={{ fontSize: 12, color: color.ink.soft }}>{aed(t.amount)} · {t.date} · balance {t.balance.toLocaleString()}</div></div>
                      {String(t.status).toLowerCase() === "pending" ? <span style={{ display: "inline-flex", gap: 6 }}><Button variant="primary" onClick={() => act({ kind: "credit.approve", id: t.id })} disabled={busy}>Approve</Button><Button onClick={() => { if (window.confirm("Reject this top-up request?")) act({ kind: "credit.reject", id: t.id }); }} disabled={busy}>Reject</Button></span> : <span style={{ fontSize: 12, fontWeight: 600, color: String(t.status).toLowerCase() === "rejected" ? color.status.negative : color.status.positive }}>{String(t.status).toLowerCase() === "rejected" ? "✗" : "✓"} {t.status}</span>}
                    </div>
                  ))}
              </div>
              <div style={cardS}>
                <div style={th}>Manual credit adjustment</div>
                {(d.tenants || []).map((t) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div><div style={{ fontSize: 12, color: color.ink.soft }}>Balance: {t.credits.toLocaleString()}</div></div>
                    <Button onClick={() => { const v = window.prompt(`Adjust credits for ${t.name} (+grant / −deduct):`, "100"); const n = Number((v || "").replace(/[^\d.-]/g, "")); if (n) act({ kind: "credit.add", companyId: t.id, delta: n }); }} disabled={busy}>+ Add Credits</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Bids" && (
            <div style={cardS}>
              <div style={th}>Best-offer bids</div>
              {(d.bids || []).length === 0 ? <div style={{ padding: 14, fontSize: 13, color: color.ink.soft }}>No bids yet.</div>
                : (d.bids || []).map((bd) => { const st = String(bd.status).toUpperCase(); const open = st === "PENDING" || st === "OUTBID"; return (
                  <div key={bd.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: color.ink.DEFAULT }}>{bd.lead} · <span style={{ color: color.brand.primary }}>{aed(bd.amount)}</span></div>
                      <div style={{ fontSize: 12, color: color.ink.soft }}>{bd.company || "—"} · balance {bd.balance.toLocaleString()} · {st}{bd.balance < bd.amount ? " · ⚠ low balance" : ""}</div>
                    </div>
                    {open ? <span style={{ display: "inline-flex", gap: 6, flexShrink: 0 }}>
                      <Button variant="primary" onClick={() => { if (window.confirm(`Accept ${aed(bd.amount)} bid from ${bd.company}? This sells the lead and charges their credits.`)) act({ kind: "bid.accept", id: bd.id }); }} disabled={busy}>Accept</Button>
                      <Button onClick={() => act({ kind: "bid.reject", id: bd.id })} disabled={busy}>Reject</Button>
                    </span> : <StatusBadge tone={st === "ACCEPTED" ? "positive" : "neutral"} label={st.toLowerCase()} />}
                  </div>
                ); })}
            </div>
          )}

          {tab === "Disputes" && (
            <div style={cardS}>
              <div style={th}>Open disputes</div>
              {(d.disputes || []).length === 0 ? <div style={{ padding: 14, fontSize: 13, color: color.ink.soft }}>No open disputes.</div>
                : (d.disputes || []).map((dp) => (
                  <div key={dp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: color.ink.DEFAULT }}>{dp.lead} · <span style={{ color: color.status.critical }}>{dp.reason}</span></div>
                      <div style={{ fontSize: 12, color: color.ink.soft }}>{dp.company || "—"} · paid {aed(dp.paid)} · {dp.date}{dp.details ? ` · ${dp.details}` : ""}</div>
                    </div>
                    <span style={{ display: "inline-flex", gap: 6, flexShrink: 0 }}>
                      <Button variant="primary" onClick={() => { if (window.confirm(`Refund ${aed(dp.paid)} to ${dp.company} and resolve?`)) act({ kind: "dispute.resolve", id: dp.id, refund: true }); }} disabled={busy}>Refund &amp; resolve</Button>
                      <Button onClick={() => act({ kind: "dispute.resolve", id: dp.id, refund: false })} disabled={busy}>Resolve (no refund)</Button>
                    </span>
                  </div>
                ))}
            </div>
          )}

          {tab === "Companies" && (
            <div style={{ ...cardS, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>Tenant</th><th style={{ ...th, textAlign: "right" }}>Users</th><th style={{ ...th, textAlign: "right" }}>Contacts</th><th style={{ ...th, textAlign: "right" }}>Credits</th><th style={{ ...th, textAlign: "right" }}>Spent</th><th style={th}>Joined</th><th style={{ ...th, textAlign: "right" }}></th></tr></thead>
                <tbody>
                  {(d.tenants || []).map((t) => (
                    <tr key={t.id}>
                      <td style={{ ...td, fontWeight: 600 }}>{t.name}</td>
                      <td style={{ ...td, textAlign: "right" }}>{t.users}</td>
                      <td style={{ ...td, textAlign: "right" }}>{t.contacts}</td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 700, color: color.status.positive }}>{t.credits.toLocaleString()}</td>
                      <td style={{ ...td, textAlign: "right" }}>{aed(t.spent)}</td>
                      <td style={{ ...td, color: color.ink.soft }}>{t.joined}</td>
                      <td style={{ ...td, textAlign: "right" }}><Button onClick={() => { const v = window.prompt(`Adjust credits for ${t.name}:`, "100"); const n = Number((v || "").replace(/[^\d.-]/g, "")); if (n) act({ kind: "credit.add", companyId: t.id, delta: n }); }} disabled={busy}>Adjust credits</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Questions" && (
            <div style={cardS}>
              <div style={th}>Lead questions</div>
              {(d.questions || []).length === 0 ? <div style={{ padding: 14, fontSize: 13, color: color.ink.soft }}>No questions.</div>
                : (d.questions || []).map((qq) => (
                  <div key={qq.id} style={{ padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, color: color.ink.DEFAULT }}>{qq.question}</div><div style={{ fontSize: 12, color: color.ink.soft }}>{qq.company || "—"} · {qq.date}{qq.answer ? ` · A: ${qq.answer}` : ""}</div></div>
                      {String(qq.status).toLowerCase() !== "answered" ? <Button onClick={() => { const a = window.prompt("Answer:"); if (a && a.trim()) act({ kind: "question.answer", id: qq.id, answer: a.trim() }); }} disabled={busy}>Answer</Button> : <StatusBadge tone="positive" label="answered" />}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "Demo Requests" && (
            <div style={{ ...cardS, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>Name</th><th style={th}>Company</th><th style={th}>Country</th><th style={th}>Use case</th><th style={th}>Status</th><th style={{ ...th, textAlign: "right" }}></th></tr></thead>
                <tbody>
                  {(d.demos || []).length === 0 ? <tr><td style={{ ...td, textAlign: "center", color: color.ink.soft }} colSpan={6}>No demo requests.</td></tr>
                    : (d.demos || []).map((m) => (
                      <tr key={m.id}>
                        <td style={td}><span style={{ fontWeight: 600 }}>{m.name}</span><div style={{ fontSize: 12, color: color.ink.soft }}>{m.email}</div></td>
                        <td style={td}>{m.company || "—"}</td>
                        <td style={td}>{m.country || "—"}</td>
                        <td style={{ ...td, maxWidth: 280 }}>{m.useCase || "—"}</td>
                        <td style={td}><StatusBadge tone={String(m.status).toLowerCase() === "new" ? "critical" : "neutral"} label={m.status} /></td>
                        <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}><Button onClick={() => act({ kind: "demo.status", id: m.id, status: "contacted" })} disabled={busy}>Contacted</Button> <Button onClick={() => act({ kind: "demo.status", id: m.id, status: "closed" })} disabled={busy}>Close</Button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Resellers" && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
              <div style={cardS}>
                <div style={th}>Resellers</div>
                {(d.resellers || []).length === 0 ? <div style={{ padding: 14, fontSize: 13, color: color.ink.soft }}>No resellers.</div>
                  : (d.resellers || []).map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                      <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.company || "—"}</div><div style={{ fontSize: 12, color: color.ink.soft }}>{Math.round(r.rate * 100)}% · earned {aed(r.earned)} · pending {aed(r.pending)}</div></div>
                      {r.approved ? <StatusBadge tone="positive" label="approved" /> : <Button variant="primary" onClick={() => act({ kind: "reseller.approve", id: r.id })} disabled={busy}>Approve</Button>}
                    </div>
                  ))}
              </div>
              <div style={cardS}>
                <div style={th}>Payout requests</div>
                {(d.payouts || []).length === 0 ? <div style={{ padding: 14, fontSize: 13, color: color.ink.soft }}>No payouts.</div>
                  : (d.payouts || []).map((po) => (
                    <div key={po.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                      <div><div style={{ fontWeight: 600, fontSize: 13 }}>{po.company || "—"}</div><div style={{ fontSize: 12, color: color.ink.soft }}>{aed(po.amount)} · {po.method || "—"} · {po.date}</div></div>
                      {String(po.status).toLowerCase() === "pending" ? <Button variant="primary" onClick={() => act({ kind: "payout.approve", id: po.id })} disabled={busy}>Mark paid</Button> : <StatusBadge tone="positive" label={po.status} />}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add / edit lead modal ── */}
      {adding && (
        <div onClick={() => !busy && setAdding(false)} style={{ position: "fixed", inset: 0, background: "rgba(16,24,38,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: "32px 16px", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 720, background: color.surface.card, borderRadius: 16, boxShadow: "0 30px 70px -18px rgba(16,24,38,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>{f.id ? "Edit lead" : "Add new lead"}</h2>
              <button onClick={() => setAdding(false)} aria-label="Close" style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16, maxHeight: "76vh", overflowY: "auto" }}>
              {prefillNote ? <div style={{ background: "rgba(34,211,166,0.10)", border: `1px solid ${color.status.positive}`, color: color.status.positive, borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 600 }}>{prefillNote}</div> : null}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Specialty / Job title *</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Registered Nurse" style={fieldS} autoFocus /></div>
                <div><label style={lbl}>Category *</label><input value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Healthcare" style={fieldS} /></div>
                <div><label style={lbl}>Origin country *</label><input value={f.originCountry} onChange={(e) => set("originCountry", e.target.value)} placeholder="e.g. Philippines" style={fieldS} /></div>
                <div><label style={lbl}>Region</label><select value={f.originRegion} onChange={(e) => set("originRegion", e.target.value)} style={fieldS}>{REGIONS.map((x) => <option key={x}>{x}</option>)}</select></div>
                <div><label style={lbl}>Quality</label><select value={f.quality} onChange={(e) => set("quality", e.target.value)} style={fieldS}>{QUALITIES.map((x) => <option key={x}>{x}</option>)}</select></div>
                <div><label style={lbl}>Years of experience</label><input type="number" value={f.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} style={fieldS} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Current location</label><input value={f.currentLocation} onChange={(e) => set("currentLocation", e.target.value)} placeholder="e.g. Dubai, UAE" style={fieldS} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Public summary (teaser — no private info)</label><textarea value={f.summary} onChange={(e) => set("summary", e.target.value)} rows={2} style={{ ...fieldS, height: "auto", padding: 10, resize: "vertical" }} /></div>
              </div>

              <div>
                <div style={sec}>Included contact info</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 14px", marginTop: 8 }}>
                  {chk("hasPhone", "Phone")}{chk("hasWhatsApp", "WhatsApp")}{chk("hasEmail", "Email")}{chk("hasLinkedIn", "LinkedIn")}{chk("hasCV", "CV / Resume")}{chk("hasDataflow", "DataFlow done")}
                </div>
              </div>

              <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 14, background: color.surface.page }}>
                <div style={{ ...sec, color: color.ink.mid }}>Private — revealed after purchase</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                  <div><label style={lbl}>First name</label><input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} style={fieldS} /></div>
                  <div><label style={lbl}>Last name</label><input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} style={fieldS} /></div>
                  <div><label style={lbl}>Phone / WhatsApp</label><input value={f.phone} onChange={(e) => set("phone", e.target.value)} style={fieldS} /></div>
                  <div><label style={lbl}>Email</label><input value={f.email} onChange={(e) => set("email", e.target.value)} style={fieldS} /></div>
                  <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>LinkedIn URL</label><input value={f.linkedIn} onChange={(e) => set("linkedIn", e.target.value)} style={fieldS} /></div>
                  <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Internal notes</label><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} style={{ ...fieldS, height: "auto", padding: 10, resize: "vertical" }} /></div>
                  <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>CV / Resume (PDF, DOC, JPG — max 5 MB)</label>
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={uploadCv} style={{ fontSize: 13 }} />
                    {f.cvName ? <span style={{ fontSize: 12, color: color.status.positive, marginLeft: 8 }}>✓ {f.cvName}</span> : null}
                  </div>
                </div>
              </div>

              <div>
                <div style={sec}>Listing type</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
                  {LISTINGS.map((o) => { const on = f.listingType === o.id; return (
                    <button key={o.id} type="button" onClick={() => set("listingType", o.id)} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${on ? color.brand.primary : color.line.strong}`, background: on ? color.brand.primaryTint : color.surface.card }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: on ? color.brand.primary : color.ink.DEFAULT }}>{o.label}</div>
                      <div style={{ fontSize: 11, color: color.ink.soft, marginTop: 2 }}>{o.hint}</div>
                    </button>
                  ); })}
                </div>
              </div>

              {f.listingType === "best_offer" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={lbl}>Min bid (AED)</label><input type="number" value={f.minBid} onChange={(e) => set("minBid", e.target.value)} placeholder="e.g. 500" style={fieldS} /></div>
                  <div><label style={lbl}>Bids close at</label><input type="datetime-local" value={f.bidsCloseAt} onChange={(e) => set("bidsCloseAt", e.target.value)} style={fieldS} /></div>
                </div>
              ) : (
                <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 14, background: color.surface.page }}>
                  <div style={sec}>Pricing &amp; decay</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 8 }}>
                    <div><label style={lbl}>Start price (AED)</label><input type="number" value={f.initialPrice} onChange={(e) => set("initialPrice", e.target.value)} style={fieldS} /></div>
                    <div><label style={lbl}>Min price (AED)</label><input type="number" value={f.minPrice} onChange={(e) => set("minPrice", e.target.value)} style={fieldS} /></div>
                    <div><label style={lbl}>Drop (AED)</label><input type="number" value={f.decayAmount} onChange={(e) => set("decayAmount", e.target.value)} disabled={f.listingType === "exclusive"} style={fieldS} /></div>
                    <div><label style={lbl}>Every (hrs)</label><input type="number" value={f.decayInterval} onChange={(e) => set("decayInterval", e.target.value)} disabled={f.listingType === "exclusive"} style={fieldS} /></div>
                  </div>
                  {f.listingType === "shared" ? <div style={{ marginTop: 10, width: 140 }}><label style={lbl}>Max buyers</label><input type="number" value={f.maxPurchases} onChange={(e) => set("maxPurchases", e.target.value)} style={fieldS} /></div> : null}
                </div>
              )}

              <div><label style={lbl}>Status</label><select value={f.status} onChange={(e) => set("status", e.target.value)} style={{ ...fieldS, width: 200 }}>{["AVAILABLE", "DRAFT", "SOLD", "EXPIRED"].map((x) => <option key={x}>{x}</option>)}</select></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 22px", borderTop: `1px solid ${color.line.DEFAULT}` }}>
              <Button onClick={() => setAdding(false)} disabled={busy}>Cancel</Button>
              <Button variant="primary" onClick={saveLead} disabled={busy || !f.name.trim()}>{busy ? "Saving…" : f.id ? "Save changes" : "Add to Marketplace"}</Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
