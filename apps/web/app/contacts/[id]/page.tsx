"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, type BadgeTone, Panel, PanelHeader, PanelBody, AskAiButton } from "@xentral/ui";

type Deal = { id: string; name: string; status: string; value: number | null; currency: string | null; created?: string };
type Doc = { id: string; number: string; status: string; total: number; paid?: number; currency: string | null };
type Task = { id: string; title: string; due: string | null };
type Act = { id: string; type: string; subject: string | null; content: string | null; at: string };
type Convo = { id: string; phone: string; body: string | null; at: string };
type Contact = { id: string; firstName: string; lastName: string | null; title: string | null; email: string | null; phone: string | null; whatsApp: string | null; status: string; notes: string | null; accountId: string | null; accountName: string | null };
type Payload = { contact: Contact; tasks: Task[]; deals: Deal[]; invoices: Doc[]; quotes: Doc[]; activities: Act[]; conversations: Convo[] };

const initials = (n: string) => n.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const aed = (v: number | null | undefined, c = "AED") => `${c} ${(Number(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const OPEN_DEAL = (s: string) => !["WON", "LOST", "UNQUALIFIED"].includes((s || "").toUpperCase());
const dealTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "WON" ? "positive" : u === "LOST" || u === "UNQUALIFIED" ? "critical" : u === "NEGOTIATION" || u === "PROPOSAL" ? "warning" : "info"; };
const invTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "PAID" ? "positive" : u === "OVERDUE" ? "critical" : u === "PARTIALLY_PAID" ? "warning" : u === "CANCELLED" ? "neutral" : "info"; };
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ") : "—";

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  const [d, setD] = React.useState<Payload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [edit, setEdit] = React.useState<{ firstName: string; lastName: string; title: string; email: string; phone: string; whatsApp: string; notes: string } | null>(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(() => {
    fetch(`/api/crm/contact/${params.id}`).then((r) => r.json()).then((j) => { setD(j.error ? null : j); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);
  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try { const r = await fetch(`/api/crm/contact/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (r.ok) load(); return r.ok; }
    finally { setBusy(false); }
  }
  async function saveEdit() { if (!edit) return; const ok = await patch(edit); if (ok) setEdit(null); }
  async function addNote() { const t = note.trim(); if (!t) return; const ok = await patch({ note: t }); if (ok) setNote(""); }

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
    { label: "Last activity", value: d.activities[0]?.at?.split(",")[0] ?? "—", tone: color.ink.DEFAULT },
  ];

  const linkRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, textDecoration: "none", color: color.ink.DEFAULT, fontSize: 13 };
  const detail = (k: string, v: React.ReactNode) => <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 13 }}><span style={{ color: color.ink.soft }}>{k}</span><span style={{ color: color.ink.DEFAULT, fontWeight: 500, textAlign: "right", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span></div>;

  return (
    <AppShell active="contacts">
      <PageTitleRow title={name} breadcrumb="CRM · Contacts"
        badge={<StatusBadge tone="info" label={cap(c.status)} />}
        actions={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <AskAiButton label="Ask AI" seed={`Draft a follow-up email to ${name}${c.accountName ? " at " + c.accountName : ""}.`} />
          {c.email ? <a href={`mailto:${c.email}`} style={{ textDecoration: "none" }}><Button>Email</Button></a> : null}
          {c.phone ? <a href={`tel:${c.phone}`} style={{ textDecoration: "none" }}><Button>Call</Button></a> : null}
          <Button onClick={() => setEdit({ firstName: c.firstName || "", lastName: c.lastName || "", title: c.title || "", email: c.email || "", phone: c.phone || "", whatsApp: c.whatsApp || "", notes: c.notes || "" })}>Edit</Button>
        </div>} />

      {/* Identity + metrics band */}
      <Panel style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: `1px solid ${color.line.DEFAULT}`, flexWrap: "wrap" }}>
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 19, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(name)}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: color.ink.DEFAULT }}>{name}</div>
            <div style={{ fontSize: 12.5, color: color.ink.mid }}>
              {c.title || "Contact"}
              {c.accountName ? <> · <a href={`/companies/${c.accountId}`} style={{ color: color.brand.primary, textDecoration: "none", fontWeight: 600 }}>{c.accountName}</a></> : null}
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
            <PanelHeader title="Details" />
            <PanelBody>
              {detail("Email", c.email ? <a href={`mailto:${c.email}`} style={{ color: color.brand.primary, textDecoration: "none" }}>{c.email}</a> : "—")}
              {detail("Phone", c.phone || "—")}
              {detail("WhatsApp", c.whatsApp || "—")}
              {detail("Company", c.accountName ? <a href={`/companies/${c.accountId}`} style={{ color: color.brand.primary, textDecoration: "none" }}>{c.accountName}</a> : "—")}
              {detail("Title", c.title || "—")}
              {detail("Status", cap(c.status))}
              {c.notes ? <div style={{ marginTop: 8, fontSize: 12.5, color: color.ink.mid, lineHeight: 1.5 }}>{c.notes}</div> : null}
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Open tasks" subtitle={`${d.tasks.length} open`} />
            <PanelBody flush>
              {d.tasks.length === 0 ? <div style={{ padding: "16px", textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No open tasks.</div>
                : d.tasks.map((t) => <div key={t.id} style={{ padding: "9px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}><div style={{ fontSize: 12.5, fontWeight: 500, color: color.ink.DEFAULT }}>{t.title}</div>{t.due ? <div style={{ fontSize: 11, color: color.ink.soft }}>Due {t.due}</div> : null}</div>)}
            </PanelBody>
          </Panel>
        </div>

        {/* main */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
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

          <Panel>
            <PanelHeader title="Timeline" subtitle="Notes, calls, billing — newest first" />
            <PanelBody>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }} placeholder="Add a note…" style={{ flex: 1, height: 34, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" }} />
                <Button variant="primary" onClick={addNote} disabled={busy || !note.trim()}>{busy ? "…" : "Add note"}</Button>
              </div>
              {d.activities.length === 0 ? <div style={{ padding: "12px 0", textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No activity yet.</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{d.activities.map((a) => (
                    <div key={a.id} style={{ display: "flex", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color.brand.primary, marginTop: 5, flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: color.ink.DEFAULT }}>{a.subject || cap(a.type)}</span>
                          <span style={{ fontSize: 11, color: color.ink.soft, marginLeft: "auto", flexShrink: 0 }}>{a.at}</span>
                        </div>
                        {a.content ? <div style={{ fontSize: 12, color: color.ink.mid, marginTop: 2, whiteSpace: "pre-wrap" }}>{a.content}</div> : null}
                      </div>
                    </div>
                  ))}</div>}
            </PanelBody>
          </Panel>
        </div>
      </div>

      {edit ? (
        <div onClick={() => !busy && setEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 22, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>Edit contact</h2>
              <button aria-label="Close" onClick={() => setEdit(null)} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            {([["firstName", "First name"], ["lastName", "Last name"], ["title", "Title"], ["email", "Email"], ["phone", "Phone"], ["whatsApp", "WhatsApp"]] as const).map(([k, lbl]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 }}>{lbl}</label>
                <input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} style={{ width: "100%", boxSizing: "border-box", height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card }} />
              </div>
            ))}
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 }}>Notes</label>
            <textarea value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} rows={3} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: 11, fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, resize: "vertical", marginBottom: 14 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setEdit(null)} disabled={busy}>Cancel</Button>
              <Button variant="primary" onClick={saveEdit} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
