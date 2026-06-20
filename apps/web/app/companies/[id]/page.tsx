"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, Button, StatusBadge, type BadgeTone, Panel, PanelHeader, PanelBody, AiInlineBar } from "@xentral/ui";

type Contact = { id: string; name: string; title: string | null; email: string | null; phone: string | null };
type Deal = { id: string; name: string; status: string; value: number | null; currency: string | null };
type Doc = { id: string; number: string; status: string; total: number; paid?: number; currency: string | null };
type Act = { id: string; type: string; subject: string | null; content: string | null; at: string; author?: string | null };
type Convo = { id: string; phone: string; body: string | null; at: string };
type Account = { id: string; name: string; industry: string | null; website: string | null; phone: string | null; email: string | null; city: string | null; country: string | null; description: string | null; ownerName?: string | null; whatsApp?: string | null; vatNumber?: string | null; addressLine1?: string | null; segment?: string | null; employees?: number | null; branchId?: string | null; branchName?: string | null };
type Payload = { account: Account; contacts: Contact[]; deals: Deal[]; invoices: Doc[]; quotes: Doc[]; activities: Act[]; conversations?: Convo[]; branches?: { id: string; name: string }[] };
type CForm = { name: string; industry: string; website: string; email: string; phone: string; city: string; country: string; description: string; whatsApp: string; vatNumber: string; addressLine1: string; segment: string; employees: string; branchId: string };

const initials = (n: string) => n.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const aed = (v: number | null | undefined, c = "AED") => `${c} ${(Number(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const OPEN_DEAL = (s: string) => !["WON", "LOST", "UNQUALIFIED"].includes((s || "").toUpperCase());
const dealTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "WON" ? "positive" : u === "LOST" || u === "UNQUALIFIED" ? "critical" : u === "NEGOTIATION" || u === "PROPOSAL" ? "warning" : "info"; };
const invTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "PAID" ? "positive" : u === "OVERDUE" ? "critical" : u === "PARTIALLY_PAID" ? "warning" : u === "CANCELLED" ? "neutral" : "info"; };
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ") : "—";
const ACT: Record<string, { icon: string; color: string }> = { NOTE: { icon: "✎", color: "#647082" }, CALL: { icon: "☎", color: "#0064d9" }, EMAIL: { icon: "@", color: "#6b3fd4" }, MEETING: { icon: "▦", color: "#188918" }, FOLLOW_UP: { icon: "⏰", color: "#df6e0c" }, STATUS_CHANGE: { icon: "⇄", color: "#647082" }, ASSIGNMENT: { icon: "◍", color: "#647082" }, TASK: { icon: "✓", color: "#188918" }, BILLING: { icon: "▣", color: "#647082" } };
const am = (k: string): { icon: string; color: string } => ACT[k] ?? { icon: "•", color: "#647082" };

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const [d, setD] = React.useState<Payload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<CForm | null>(null);
  const [clean, setClean] = React.useState<CForm | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [noteType, setNoteType] = React.useState("NOTE");
  const [mode, setMode] = React.useState<"none" | "link" | "new">("none");
  const [nc, setNc] = React.useState({ first: "", last: "", email: "", title: "" });
  const [allContacts, setAllContacts] = React.useState<{ id: string; name: string; email: string; accountId: string | null }[]>([]);
  const [linkId, setLinkId] = React.useState("");

  const load = React.useCallback(() => {
    fetch(`/api/crm/account/${params.id}`).then((r) => r.json()).then((j) => {
      if (j.error) { setD(null); setLoading(false); return; }
      setD(j); const a = j.account;
      const f: CForm = { name: a.name || "", industry: a.industry || "", website: a.website || "", email: a.email || "", phone: a.phone || "", city: a.city || "", country: a.country || "", description: a.description || "", whatsApp: a.whatsApp || "", vatNumber: a.vatNumber || "", addressLine1: a.addressLine1 || "", segment: a.segment || "", employees: a.employees != null ? String(a.employees) : "", branchId: a.branchId || "" };
      setForm(f); setClean(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);

  const dirty = !!form && !!clean && (Object.keys(form) as (keyof CForm)[]).some((k) => form[k] !== clean[k]);
  const set = (k: keyof CForm, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));
  async function patch(body: Record<string, unknown>) { setBusy(true); try { const r = await fetch(`/api/crm/account/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (r.ok) load(); return r.ok; } finally { setBusy(false); } }
  async function saveForm() { if (!form) return; const ok = await patch(form); if (ok) { setClean(form); setSaved(true); setTimeout(() => setSaved(false), 2000); } }
  async function addNote() { const t = note.trim(); if (!t) return; const ok = await patch({ note: t, activityType: noteType }); if (ok) setNote(""); }
  async function submitContact() { if (!nc.first.trim()) return; const ok = await patch({ contactFirstName: nc.first.trim(), contactLastName: nc.last.trim(), contactEmail: nc.email.trim(), contactTitle: nc.title.trim() }); if (ok) { setNc({ first: "", last: "", email: "", title: "" }); setMode("none"); } }
  React.useEffect(() => { if (mode !== "link") return; fetch("/api/crm/contacts").then((r) => r.json()).then((j) => setAllContacts(Array.isArray(j.rows) ? j.rows : [])).catch(() => {}); }, [mode]);
  async function linkContact() {
    if (!linkId) return; setBusy(true);
    try { const r = await fetch(`/api/crm/contact/${linkId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: params.id }) }); if (r.ok) { setLinkId(""); setMode("none"); load(); } }
    finally { setBusy(false); }
  }

  const fieldS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 10px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };
  const labelS: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 4 };
  const linkRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, textDecoration: "none", color: color.ink.DEFAULT, fontSize: 13 };

  if (loading) return <AppShell active="companies"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!d || !form) return <AppShell active="companies"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Company not found. <a href="/companies" style={{ color: color.brand.primary }}>Back to companies</a></div></AppShell>;

  const a = d.account;
  const openDeals = d.deals.filter((x) => OPEN_DEAL(x.status));
  const openValue = openDeals.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const revenue = d.invoices.reduce((s, x) => s + (Number(x.paid) || 0), 0);
  const outstanding = d.invoices.filter((x) => ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes((x.status || "").toUpperCase())).reduce((s, x) => s + (Number(x.total) - (Number(x.paid) || 0)), 0);
  const metrics = [
    { label: "Lifetime revenue", value: revenue > 0 ? aed(revenue) : "—", tone: color.status.positive },
    { label: "Outstanding", value: outstanding > 0 ? aed(outstanding) : "—", tone: outstanding > 0 ? color.status.critical : color.ink.DEFAULT },
    { label: "Open deals", value: openDeals.length ? `${openDeals.length} · ${aed(openValue)}` : "—", tone: color.ink.DEFAULT },
    { label: "Contacts", value: String(d.contacts.length), tone: color.ink.DEFAULT },
    { label: "Last activity", value: d.activities[0]?.at?.split(",")[0] ?? "—", tone: color.ink.DEFAULT },
  ];
  const overdue = d.invoices.filter((x) => (x.status || "").toUpperCase() === "OVERDUE");
  const overdueAmt = overdue.reduce((acc, x) => acc + (Number(x.total) - (Number(x.paid) || 0)), 0);
  const actionNeeded = overdue.length > 0 || outstanding > 0 || openDeals.length > 0;
  const nextStep = overdue.length ? `Chase ${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""} · ${aed(overdueAmt)}`
    : outstanding > 0 ? `Collect ${aed(outstanding)} outstanding`
    : openDeals.length ? `Advance ${openDeals.length} open deal${openDeals.length > 1 ? "s" : ""} · ${aed(openValue)}`
    : d.contacts.length === 0 ? "Add a contact to start the relationship"
    : "No open actions — log a touchpoint to stay warm.";

  return (
    <AppShell active="companies">
      {/* Identity */}
      <a href="/companies" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: color.ink.mid, textDecoration: "none" }}>← Companies</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "10px 0 14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, background: color.brand.primaryTint, color: color.brand.primary, fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(a.name)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 20, lineHeight: 1.1, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{a.name}</h1>
              {a.industry ? <StatusBadge tone="info" label={a.industry} /> : null}
            </div>
            <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 3 }}>Company record{[a.city, a.country].filter(Boolean).length ? ` · ${[a.city, a.country].filter(Boolean).join(", ")}` : ""}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 9 }}>
              {([["Owner", a.ownerName || "Unassigned"], ["Segment", a.segment || "—"], ["Open pipeline", openValue > 0 ? aed(openValue) : "—"], ["Last touch", d.activities[0]?.at?.split(",")[0] ?? "—"]] as [string, string][]).map(([l, v]) => (
                <div key={l} style={{ minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: color.ink.soft }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {dirty ? <Button variant="primary" onClick={saveForm} disabled={busy}>{busy ? "Saving…" : "Save"}</Button> : (saved ? <span style={{ fontSize: 13, fontWeight: 600, color: color.status.positive }}>✓ Saved</span> : null)}
          {a.website ? <a href={a.website.startsWith("http") ? a.website : `https://${a.website}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Button>Website</Button></a> : null}
        </div>
      </div>

      <AiInlineBar subject={a.name} />

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {a.phone ? <a href={`tel:${a.phone}`} style={{ textDecoration: "none" }}><Button>☎ Call</Button></a> : null}
        {a.email ? <a href={`mailto:${a.email}`} style={{ textDecoration: "none" }}><Button>@ Email</Button></a> : null}
        {(a.whatsApp || a.phone) ? <a href={`https://wa.me/${(a.whatsApp || a.phone || "").replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Button>✆ WhatsApp</Button></a> : null}
      </div>

      {/* Next step — the one thing to do */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 12, border: `1px solid ${color.line.DEFAULT}`, background: color.brand.primaryTint, marginBottom: 14 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.brand.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: color.brand.primary, flexShrink: 0 }}>Next step</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: actionNeeded ? color.ink.DEFAULT : color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextStep}</span>
      </div>

      {/* Metrics tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, background: color.surface.card, padding: "10px 13px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: color.ink.soft }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: m.tone, marginTop: 3 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Body — two equal columns like the old app */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, alignItems: "start" }}>
        {/* left rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Panel>
            <PanelHeader title="Details" actions={dirty ? <Button variant="primary" onClick={saveForm} disabled={busy}>{busy ? "Saving…" : "Save"}</Button> : (saved ? <span style={{ fontSize: 12, fontWeight: 600, color: color.status.positive }}>✓ Saved</span> : <span style={{ fontSize: 12, color: color.ink.soft }}>Edit any field</span>)} />
            <PanelBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div><label style={labelS}>Company name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Industry</label><input value={form.industry} onChange={(e) => set("industry", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Website</label><input value={form.website} onChange={(e) => set("website", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Email</label><input value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Phone</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>WhatsApp</label><input value={form.whatsApp} onChange={(e) => set("whatsApp", e.target.value)} placeholder="+9715XXXXXXXX" style={fieldS} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={labelS}>VAT / TRN</label><input value={form.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} style={fieldS} /></div>
                  <div><label style={labelS}>Segment</label><input value={form.segment} onChange={(e) => set("segment", e.target.value)} placeholder="Enterprise / SMB / VIP" style={fieldS} /></div>
                </div>
                <div><label style={labelS}>Address</label><input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} style={fieldS} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={labelS}>Employees</label><input value={form.employees} inputMode="numeric" onChange={(e) => set("employees", e.target.value)} style={fieldS} /></div>
                  <div><label style={labelS}>Branch</label><select value={form.branchId} onChange={(e) => set("branchId", e.target.value)} style={fieldS}><option value="">— None —</option>{(d.branches || []).map((br) => <option key={br.id} value={br.id}>{br.name}</option>)}</select></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={labelS}>City</label><input value={form.city} onChange={(e) => set("city", e.target.value)} style={fieldS} /></div>
                  <div><label style={labelS}>Country</label><input value={form.country} onChange={(e) => set("country", e.target.value)} style={fieldS} /></div>
                </div>
                <div><label style={labelS}>Description</label><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ ...fieldS, height: "auto", padding: 10, resize: "vertical" }} /></div>
              </div>
            </PanelBody>
          </Panel>
        </div>

        {/* main */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Panel>
            <PanelHeader title="Leads & deals" subtitle={`${d.deals.length} total · ${openDeals.length} open`} />
            <PanelBody flush>
              {d.deals.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: color.ink.soft }}>No leads linked to this company yet.</div>
                : d.deals.map((l) => (
                  <a key={l.id} href={`/leads/${l.id}`} className="xui-row-link" style={linkRow}>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name || "Deal"}</span>
                    <StatusBadge tone={dealTone(l.status)} label={cap(l.status)} />
                    <span style={{ width: 110, textAlign: "right", color: color.ink.mid }}>{l.value ? aed(l.value, l.currency || "AED") : "—"}</span>
                  </a>
                ))}
            </PanelBody>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <Panel>
              <PanelHeader title="Offers" subtitle={`${d.quotes.length}`} />
              <PanelBody flush>
                {d.quotes.length === 0 ? <div style={{ padding: 14, textAlign: "center", fontSize: 12, color: color.ink.soft }}>No offers.</div>
                  : d.quotes.map((q) => <a key={q.id} href={`/quotations/${q.id}`} className="xui-row-link" style={linkRow}><span style={{ fontWeight: 600, color: color.brand.primary, flex: 1 }}>{q.number}</span><StatusBadge tone={invTone(q.status)} label={cap(q.status)} /><span style={{ fontWeight: 600 }}>{aed(q.total, q.currency || "AED")}</span></a>)}
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader title="Invoices" subtitle={`${d.invoices.length}`} />
              <PanelBody flush>
                {d.invoices.length === 0 ? <div style={{ padding: 14, textAlign: "center", fontSize: 12, color: color.ink.soft }}>No invoices.</div>
                  : d.invoices.map((i) => <a key={i.id} href={`/invoices/${i.id}`} className="xui-row-link" style={linkRow}><span style={{ fontWeight: 600, color: color.brand.primary, flex: 1 }}>{i.number}</span><StatusBadge tone={invTone(i.status)} label={cap(i.status)} /><span style={{ fontWeight: 600 }}>{aed(i.total, i.currency || "AED")}</span></a>)}
              </PanelBody>
            </Panel>
          </div>

          {d.conversations && d.conversations.length > 0 ? (
            <Panel>
              <PanelHeader title="WhatsApp conversations" actions={<a href="/inbox" style={{ fontSize: 12, color: color.brand.primary, textDecoration: "none" }}>Open inbox</a>} />
              <PanelBody flush>
                {d.conversations.map((cv) => <div key={cv.id} style={{ padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}><div style={{ fontSize: 13, fontWeight: 500 }}>{cv.phone} <span style={{ color: color.ink.soft, fontWeight: 400 }}>· {cv.at}</span></div>{cv.body ? <div style={{ fontSize: 12, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cv.body}</div> : null}</div>)}
              </PanelBody>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="Timeline" subtitle="Everything across contacts, leads and billing" />
            <PanelBody>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {(["NOTE","CALL","MEETING","EMAIL","FOLLOW_UP"] as const).map((tp) => { const on = noteType === tp; return <button key={tp} onClick={() => setNoteType(tp)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? color.brand.primary : color.line.strong}`, background: on ? color.brand.primaryTint : color.surface.card, color: on ? color.brand.primary : color.ink.mid }}>{am(tp).icon} {cap(tp)}</button>; })}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }} placeholder={noteType === "NOTE" ? "Add a note…" : `Log a ${cap(noteType).toLowerCase()}…`} style={{ flex: 1, height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" }} />
                <Button variant="primary" onClick={addNote} disabled={busy || !note.trim()}>{busy ? "…" : "Log"}</Button>
              </div>
              {d.activities.length === 0 ? <div style={{ padding: "12px 0", textAlign: "center", fontSize: 13, color: color.ink.soft }}>No activity yet — log your first call or note above.</div>
                : <div style={{ display: "flex", flexDirection: "column" }}>{d.activities.map((act, idx) => { const m = am(act.type); return (
                    <div key={act.id} style={{ display: "flex", gap: 11, paddingBottom: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <span style={{ width: 26, height: 26, borderRadius: "50%", background: `color-mix(in srgb, ${m.color} 14%, ${color.surface.card})`, color: m.color, fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{m.icon}</span>
                        {idx < d.activities.length - 1 ? <span style={{ flex: 1, width: 1, background: color.line.DEFAULT, marginTop: 2 }} /> : null}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{act.subject || cap(act.type)}</span>
                          <span style={{ fontSize: 11, color: color.ink.soft, marginLeft: "auto", flexShrink: 0 }}>{act.at}</span>
                        </div>
                        {act.content ? <div style={{ fontSize: 12, color: color.ink.mid, marginTop: 2, whiteSpace: "pre-wrap" }}>{act.content}</div> : null}
                        {act.author ? <div style={{ fontSize: 11, color: color.ink.soft, marginTop: 3 }}>by {act.author}</div> : null}
                      </div>
                    </div>
                  ); })}</div>}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Contacts" subtitle={`${d.contacts.length} linked`} actions={
              <span style={{ display: "inline-flex", gap: 6 }}>
                <Button onClick={() => setMode(mode === "link" ? "none" : "link")}>{mode === "link" ? "Close" : "Link"}</Button>
                <Button variant="primary" onClick={() => setMode(mode === "new" ? "none" : "new")}>{mode === "new" ? "Close" : "+ New"}</Button>
              </span>} />
            <PanelBody flush>
              {mode === "link" ? (
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: color.surface.page, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: color.ink.soft, textTransform: "uppercase", letterSpacing: 0.3 }}>Link an existing contact</span>
                  <select autoFocus value={linkId} onChange={(e) => setLinkId(e.target.value)} style={{ ...fieldS, height: 36, fontSize: 13 }}>
                    <option value="">Select a contact…</option>
                    {allContacts.filter((x) => x.accountId !== params.id && x.name.trim()).map((x) => (
                      <option key={x.id} value={x.id}>{x.name}{x.email ? ` · ${x.email}` : ""}{x.accountId ? " (linked elsewhere)" : ""}</option>
                    ))}
                  </select>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <Button onClick={() => { setMode("none"); setLinkId(""); }} disabled={busy}>Cancel</Button>
                    <Button variant="primary" onClick={linkContact} disabled={busy || !linkId}>{busy ? "Linking…" : "Link contact"}</Button>
                  </div>
                </div>
              ) : null}
              {mode === "new" ? (
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: color.surface.page, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input autoFocus value={nc.first} onChange={(e) => setNc({ ...nc, first: e.target.value })} placeholder="First name *" style={{ ...fieldS, height: 32, fontSize: 13 }} />
                    <input value={nc.last} onChange={(e) => setNc({ ...nc, last: e.target.value })} placeholder="Last name" style={{ ...fieldS, height: 32, fontSize: 13 }} />
                  </div>
                  <input value={nc.title} onChange={(e) => setNc({ ...nc, title: e.target.value })} placeholder="Title (optional)" style={{ ...fieldS, height: 32, fontSize: 13 }} />
                  <input value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitContact(); } }} placeholder="Email (optional)" style={{ ...fieldS, height: 32, fontSize: 13 }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <Button onClick={() => setMode("none")} disabled={busy}>Cancel</Button>
                    <Button variant="primary" onClick={submitContact} disabled={busy || !nc.first.trim()}>{busy ? "Saving…" : "Add contact"}</Button>
                  </div>
                </div>
              ) : null}
              {d.contacts.length === 0 && mode === "none" ? <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: color.ink.soft }}>No contacts yet. Use “Link” or “+ New”.</div>
                : d.contacts.map((p) => (
                  <a key={p.id} href={`/contacts/${p.id}`} className="xui-row-link" style={linkRow}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(p.name)}</span>
                    <span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>{p.title ? <span style={{ display: "block", fontSize: 11, color: color.ink.soft }}>{p.title}</span> : null}</span>
                  </a>
                ))}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
