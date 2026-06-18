"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, type BadgeTone, Panel, PanelHeader, PanelBody, AskAiButton } from "@xentral/ui";

type Deal = { id: string; name: string; status: string; value: number | null; currency: string | null; created?: string };
type Doc = { id: string; number: string; status: string; total: number; paid?: number; currency: string | null };
type Task = { id: string; title: string; due: string | null };
type Act = { id: string; type: string; subject: string | null; content: string | null; at: string; author?: string | null; direction?: string | null; outcome?: string | null };
type Convo = { id: string; phone: string; body: string | null; at: string };
type Contact = { id: string; firstName: string; lastName: string | null; title: string | null; email: string | null; phone: string | null; whatsApp: string | null; status: string; notes: string | null; accountId: string | null; accountName: string | null; leadSource?: string | null; assignedToId?: string | null; assignedToName?: string | null; salutation?: string | null; addressLine1?: string | null; city?: string | null; country?: string | null; website?: string | null; instagram?: string | null; linkedIn?: string | null; contactKind?: string | null };
type Payload = { contact: Contact; tasks: Task[]; deals: Deal[]; invoices: Doc[]; quotes: Doc[]; activities: Act[]; conversations: Convo[] };

const initials = (n: string) => n.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const aed = (v: number | null | undefined, c = "AED") => `${c} ${(Number(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const OPEN_DEAL = (s: string) => !["WON", "LOST", "UNQUALIFIED"].includes((s || "").toUpperCase());
const dealTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "WON" ? "positive" : u === "LOST" || u === "UNQUALIFIED" ? "critical" : u === "NEGOTIATION" || u === "PROPOSAL" ? "warning" : "info"; };
const invTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "PAID" ? "positive" : u === "OVERDUE" ? "critical" : u === "PARTIALLY_PAID" ? "warning" : u === "CANCELLED" ? "neutral" : "info"; };
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ") : "—";
const ACT: Record<string, { icon: string; color: string }> = { NOTE: { icon: "✎", color: "#647082" }, CALL: { icon: "☎", color: "#0064d9" }, EMAIL: { icon: "@", color: "#6b3fd4" }, MEETING: { icon: "▦", color: "#188918" }, FOLLOW_UP: { icon: "⏰", color: "#df6e0c" }, STATUS_CHANGE: { icon: "⇄", color: "#647082" }, ASSIGNMENT: { icon: "◍", color: "#647082" }, TASK: { icon: "✓", color: "#188918" }, BILLING: { icon: "▣", color: "#647082" } };
const am = (k: string): { icon: string; color: string } => ACT[k] ?? { icon: "•", color: "#647082" };

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  type Form = { firstName: string; lastName: string; title: string; email: string; phone: string; whatsApp: string; notes: string; accountId: string; leadSource: string; assignedToId: string; status: string; salutation: string; addressLine1: string; city: string; country: string; website: string; instagram: string; linkedIn: string; contactKind: string };
  const [d, setD] = React.useState<Payload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<Form | null>(null);
  const [clean, setClean] = React.useState<Form | null>(null);
  const [accounts, setAccounts] = React.useState<{ id: string; name: string }[]>([]);
  const [owners, setOwners] = React.useState<{ id: string; name: string }[]>([]);
  const [note, setNote] = React.useState("");
  const [noteType, setNoteType] = React.useState("NOTE");
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const load = React.useCallback(() => {
    fetch(`/api/crm/contact/${params.id}`).then((r) => r.json()).then((j) => {
      if (j.error) { setD(null); setLoading(false); return; }
      setD(j);
      const f: Form = { firstName: j.contact.firstName || "", lastName: j.contact.lastName || "", title: j.contact.title || "", email: j.contact.email || "", phone: j.contact.phone || "", whatsApp: j.contact.whatsApp || "", notes: j.contact.notes || "", accountId: j.contact.accountId || "", leadSource: j.contact.leadSource || "", assignedToId: j.contact.assignedToId || "", status: j.contact.status || "NEW", salutation: j.contact.salutation || "", addressLine1: j.contact.addressLine1 || "", city: j.contact.city || "", country: j.contact.country || "", website: j.contact.website || "", instagram: j.contact.instagram || "", linkedIn: j.contact.linkedIn || "", contactKind: j.contact.contactKind || "" };
      setForm(f); setClean(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { fetch("/api/crm/accounts").then((r) => r.json()).then((j) => setAccounts(Array.isArray(j.rows) ? j.rows : [])).catch(() => {}); }, []);
  React.useEffect(() => { fetch("/api/books/owners").then((r) => r.json()).then((j) => setOwners(Array.isArray(j.rows) ? j.rows : [])).catch(() => {}); }, []);
  const dirty = !!form && !!clean && (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== clean[k]);
  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try { const r = await fetch(`/api/crm/contact/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (r.ok) load(); return r.ok; }
    finally { setBusy(false); }
  }
  async function saveForm() { if (!form) return; const ok = await patch(form); if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); } }
  async function addNote() { const t = note.trim(); if (!t) return; const ok = await patch({ note: t, activityType: noteType }); if (ok) setNote(""); }
  const [newTask, setNewTask] = React.useState("");
  async function addTask() { const t = newTask.trim(); if (!t) return; const ok = await patch({ task: t }); if (ok) setNewTask(""); }
  async function addDeal() {
    const name = window.prompt("Deal name:"); if (!name || !name.trim()) return;
    const valS = window.prompt("Value (AED, optional):") || "";
    const value = Number(valS.replace(/[^\d.]/g, "")) || undefined;
    await patch({ dealName: name.trim(), dealValue: value });
  }
  function vcard() {
    if (!d) return; const cc = d.contact; const fn = `${cc.firstName} ${cc.lastName ?? ""}`.trim();
    const L = ["BEGIN:VCARD","VERSION:3.0",`N:${cc.lastName||""};${cc.firstName||""};;${cc.salutation||""};`,`FN:${fn}`, cc.title?`TITLE:${cc.title}`:"", cc.accountName?`ORG:${cc.accountName}`:"", cc.email?`EMAIL;TYPE=WORK:${cc.email}`:"", cc.phone?`TEL;TYPE=WORK,VOICE:${cc.phone}`:"", cc.whatsApp?`TEL;TYPE=CELL:${cc.whatsApp}`:"", cc.website?`URL:${cc.website}`:"", (cc.addressLine1||cc.city||cc.country)?`ADR;TYPE=WORK:;;${cc.addressLine1||""};${cc.city||""};;;${cc.country||""}`:"", "END:VCARD"].filter(Boolean);
    const blob = new Blob([L.join("\r\n")], { type: "text/vcard" }); const el = document.createElement("a"); el.href = URL.createObjectURL(blob); el.download = `${fn||"contact"}.vcf`; el.click(); URL.revokeObjectURL(el.href);
  }
  const set = (k: keyof Form, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const fieldS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 34, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 10px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };
  const labelS: React.CSSProperties = { display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 4 };

  if (loading) return <AppShell active="contacts"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!d) return <AppShell active="contacts"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Contact not found. <a href="/contacts" style={{ color: color.brand.primary }}>Back to contacts</a></div></AppShell>;

  const c = d.contact;
  const name = `${c.firstName} ${c.lastName ?? ""}`.trim();
  const openDeals = d.deals.filter((x) => OPEN_DEAL(x.status));
  const pipeline = openDeals.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const revenue = d.invoices.reduce((s, x) => s + (Number(x.paid) || 0), 0);
  const outstanding = d.invoices.filter((x) => ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes((x.status || "").toUpperCase())).reduce((s, x) => s + (Number(x.total) - (Number(x.paid) || 0)), 0);

  const metrics = [
    { label: "Revenue", value: revenue > 0 ? aed(revenue) : "—", tone: color.status.positive },
    { label: "Outstanding", value: outstanding > 0 ? aed(outstanding) : "—", tone: outstanding > 0 ? color.status.critical : color.ink.DEFAULT },
    { label: "Open deals", value: openDeals.length ? `${openDeals.length} · ${aed(pipeline)}` : "—", tone: color.ink.DEFAULT },
    { label: "Open tasks", value: d.tasks.length ? String(d.tasks.length) : "—", tone: color.ink.DEFAULT },
  ];

  const linkRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, textDecoration: "none", color: color.ink.DEFAULT, fontSize: 13 };

  return (
    <AppShell active="contacts">
      <PageTitleRow title={name} breadcrumb="CRM · Contacts"
        badge={<StatusBadge tone="info" label={cap(c.status)} />}
        actions={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <AskAiButton label="Ask AI" seed={`Draft a follow-up email to ${name}${c.accountName ? " at " + c.accountName : ""}.`} />
          {c.email ? <a href={`mailto:${c.email}`} style={{ textDecoration: "none" }}><Button>Email</Button></a> : null}
          {c.phone ? <a href={`tel:${c.phone}`} style={{ textDecoration: "none" }}><Button>Call</Button></a> : null}
          {(c.whatsApp || c.phone) ? <a href={`https://wa.me/${(c.whatsApp || c.phone || "").replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Button>WhatsApp</Button></a> : null}
          <Button onClick={vcard}>vCard</Button>
          <Button variant="primary" onClick={addDeal}>+ New deal</Button>
        </div>} />

      {/* Identity + metrics band */}
      <Panel style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: `1px solid ${color.line.DEFAULT}`, flexWrap: "wrap" }}>
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 19, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(name)}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13.5, color: color.ink.mid }}>{c.title || "Contact"}{c.accountName ? <> · <a href={`/companies/${c.accountId}`} style={{ color: color.brand.primary, textDecoration: "none", fontWeight: 600 }}>{c.accountName}</a></> : null}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginTop: 9 }}>
              {([["Owner", c.assignedToName || "Unassigned"], ["Lead source", c.leadSource || "—"], ["Last touch", d.activities[0]?.at?.split(",")[0] ?? "—"], ["Next step", d.tasks[0] ? (d.tasks[0].title + (d.tasks[0].due ? " · " + d.tasks[0].due : "")) : "—"]] as [string, string][]).map(([l, v]) => (
                <div key={l} style={{ minWidth: 0 }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: color.ink.soft }}>{l}</div><div style={{ fontSize: 12.5, fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>
        <PanelBody>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
            {metrics.map((m) => (
              <div key={m.label} style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, background: color.surface.page, padding: "9px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: color.ink.soft }}>{m.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.tone, marginTop: 3 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </PanelBody>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
        {/* left rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Details" actions={dirty ? <Button variant="primary" onClick={saveForm} disabled={busy}>{busy ? "Saving…" : "Save"}</Button> : (saved ? <span style={{ fontSize: 12, fontWeight: 600, color: color.status.positive }}>✓ Saved</span> : <span style={{ fontSize: 11.5, color: color.ink.soft }}>Edit any field</span>)} />
            <PanelBody>
              {form ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1fr 1fr", gap: 10 }}>
                    <div><label style={labelS}>Salutation</label><select value={form.salutation} onChange={(e) => set("salutation", e.target.value)} style={fieldS}><option value="">—</option>{["Mr","Mrs","Ms","Mx","Dr","Prof.","Eng.","Sheikh","Sheikha","H.E.","Hon."].map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
                    <div><label style={labelS}>First name</label><input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} style={fieldS} /></div>
                    <div><label style={labelS}>Last name</label><input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} style={fieldS} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={labelS}>Job title</label><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Procurement Manager" style={fieldS} /></div>
                    <div><label style={labelS}>Type</label><select value={form.contactKind} onChange={(e) => set("contactKind", e.target.value)} style={fieldS}><option value="">—</option><option value="Business">Business</option><option value="Private">Private</option></select></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={labelS}>Email</label><input value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldS} /></div>
                    <div><label style={labelS}>Phone</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={fieldS} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={labelS}>WhatsApp</label><input value={form.whatsApp} onChange={(e) => set("whatsApp", e.target.value)} style={fieldS} /></div>
                    <div><label style={labelS}>LinkedIn</label><input value={form.linkedIn} onChange={(e) => set("linkedIn", e.target.value)} placeholder="profile URL" style={fieldS} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={labelS}>Website</label><input value={form.website} onChange={(e) => set("website", e.target.value)} style={fieldS} /></div>
                    <div><label style={labelS}>Instagram</label><input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@handle" style={fieldS} /></div>
                  </div>
                  <div>
                    <label style={labelS}>Company</label>
                    <select value={form.accountId} onChange={(e) => set("accountId", e.target.value)} style={fieldS}>
                      <option value="">— No company —</option>
                      {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {form.accountId ? <a href={`/companies/${form.accountId}`} style={{ display: "inline-block", marginTop: 5, fontSize: 12, color: color.brand.primary, textDecoration: "none", fontWeight: 600 }}>Open company →</a> : null}
                  </div>
                  <div><label style={labelS}>Address</label><input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} placeholder="Street / building" style={fieldS} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={labelS}>City</label><input value={form.city} onChange={(e) => set("city", e.target.value)} style={fieldS} /></div>
                    <div><label style={labelS}>Country</label><input value={form.country} onChange={(e) => set("country", e.target.value)} style={fieldS} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={labelS}>Lead source</label><select value={form.leadSource} onChange={(e) => set("leadSource", e.target.value)} style={fieldS}><option value="">—</option>{["Website","Referral","WhatsApp","Marketplace","Event","Cold outreach","Advertising","Other"].map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
                    <div><label style={labelS}>Status</label><select value={form.status} onChange={(e) => set("status", e.target.value)} style={fieldS}>{["NEW","CONTACTED","QUALIFIED","PROPOSAL","NEGOTIATION","WON","LOST","ON_HOLD"].map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></div>
                  </div>
                  <div><label style={labelS}>Owner</label><select value={form.assignedToId} onChange={(e) => set("assignedToId", e.target.value)} style={fieldS}><option value="">Unassigned</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                  <div><label style={labelS}>Notes</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...fieldS, height: "auto", padding: 10, resize: "vertical" }} /></div>
                </div>
              ) : null}
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Open tasks" subtitle={`${d.tasks.length} open`} />
            <PanelBody flush>
              <div style={{ display: "flex", gap: 8, padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }} placeholder="Add a task…" style={{ flex: 1, height: 32, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 10px", fontSize: 12.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" }} />
                <Button onClick={addTask} disabled={busy || !newTask.trim()}>Add</Button>
              </div>
              {d.tasks.length === 0 ? <div style={{ padding: "16px", textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No open tasks.</div>
                : d.tasks.map((t) => <div key={t.id} style={{ padding: "9px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}><div style={{ fontSize: 12.5, fontWeight: 500, color: color.ink.DEFAULT }}>{t.title}</div>{t.due ? <div style={{ fontSize: 11, color: color.ink.soft }}>Due {t.due}</div> : null}</div>)}
            </PanelBody>
          </Panel>
        </div>

        {/* main */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Panel>
            <PanelHeader title="Timeline" subtitle="Notes, calls, billing — newest first" />
            <PanelBody>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {(["NOTE","CALL","MEETING","EMAIL","FOLLOW_UP"] as const).map((tp) => { const on = noteType === tp; return <button key={tp} onClick={() => setNoteType(tp)} style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? color.brand.primary : color.line.strong}`, background: on ? color.brand.primaryTint : color.surface.card, color: on ? color.brand.primary : color.ink.mid }}>{am(tp).icon} {cap(tp)}</button>; })}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }} placeholder={noteType === "NOTE" ? "Add a note…" : `Log a ${cap(noteType).toLowerCase()}…`} style={{ flex: 1, height: 34, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" }} />
                <Button variant="primary" onClick={addNote} disabled={busy || !note.trim()}>{busy ? "…" : "Log"}</Button>
              </div>
              {d.activities.length === 0 ? <div style={{ padding: "12px 0", textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No activity yet — log your first call or note above.</div>
                : <div style={{ display: "flex", flexDirection: "column" }}>{d.activities.map((a, idx) => { const m = am(a.type); return (
                    <div key={a.id} style={{ display: "flex", gap: 11, paddingBottom: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <span style={{ width: 26, height: 26, borderRadius: "50%", background: `color-mix(in srgb, ${m.color} 14%, ${color.surface.card})`, color: m.color, fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{m.icon}</span>
                        {idx < d.activities.length - 1 ? <span style={{ flex: 1, width: 1, background: color.line.DEFAULT, marginTop: 2 }} /> : null}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: color.ink.DEFAULT }}>{a.subject || cap(a.type)}</span>
                          <span style={{ fontSize: 11, color: color.ink.soft, marginLeft: "auto", flexShrink: 0 }}>{a.at}</span>
                        </div>
                        {a.content ? <div style={{ fontSize: 12, color: color.ink.mid, marginTop: 2, whiteSpace: "pre-wrap" }}>{a.content}</div> : null}
                        {a.author ? <div style={{ fontSize: 10.5, color: color.ink.soft, marginTop: 3 }}>by {a.author}</div> : null}
                      </div>
                    </div>
                  ); })}</div>}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Deals" subtitle={`${d.deals.length} linked · ${openDeals.length} open`} />
            <PanelBody flush>
              {d.deals.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No deals linked to this contact yet.</div>
                : d.deals.map((l) => (
                  <a key={l.id} href={`/leads/${l.id}`} className="xui-row-link" style={linkRow}>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name || "Deal"}</span>
                    <StatusBadge tone={dealTone(l.status)} label={cap(l.status)} />
                    <span style={{ width: 110, textAlign: "right", color: color.ink.mid }}>{l.value ? aed(l.value, l.currency || "AED") : "—"}</span>
                  </a>
                ))}
            </PanelBody>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
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

          {d.conversations.length > 0 && (
            <Panel>
              <PanelHeader title="WhatsApp" actions={<a href="/inbox" style={{ fontSize: 12, color: color.brand.primary, textDecoration: "none" }}>Open inbox</a>} />
              <PanelBody flush>
                {d.conversations.map((cv) => <div key={cv.id} style={{ padding: "9px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}><div style={{ fontSize: 12.5, fontWeight: 500 }}>{cv.phone} <span style={{ color: color.ink.soft, fontWeight: 400 }}>· {cv.at}</span></div>{cv.body ? <div style={{ fontSize: 11.5, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cv.body}</div> : null}</div>)}
              </PanelBody>
            </Panel>
          )}

          
        </div>
      </div>
    </AppShell>
  );
}
