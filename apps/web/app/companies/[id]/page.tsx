"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, Button, StatusBadge, type BadgeTone, Panel, PanelHeader, PanelBody, AskAiButton } from "@xentral/ui";

type Contact = { id: string; name: string; title: string | null; email: string | null; phone: string | null };
type Deal = { id: string; name: string; status: string; value: number | null; currency: string | null };
type Doc = { id: string; number: string; status: string; total: number; paid?: number; currency: string | null };
type Act = { id: string; type: string; subject: string | null; content: string | null; at: string };
type Convo = { id: string; phone: string; body: string | null; at: string };
type Account = { id: string; name: string; industry: string | null; website: string | null; phone: string | null; email: string | null; city: string | null; country: string | null; description: string | null };
type Payload = { account: Account; contacts: Contact[]; deals: Deal[]; invoices: Doc[]; quotes: Doc[]; activities: Act[]; conversations?: Convo[] };
type CForm = { name: string; industry: string; website: string; email: string; phone: string; city: string; country: string; description: string };

const initials = (n: string) => n.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const aed = (v: number | null | undefined, c = "AED") => `${c} ${(Number(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const OPEN_DEAL = (s: string) => !["WON", "LOST", "UNQUALIFIED"].includes((s || "").toUpperCase());
const dealTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "WON" ? "positive" : u === "LOST" || u === "UNQUALIFIED" ? "critical" : u === "NEGOTIATION" || u === "PROPOSAL" ? "warning" : "info"; };
const invTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "PAID" ? "positive" : u === "OVERDUE" ? "critical" : u === "PARTIALLY_PAID" ? "warning" : u === "CANCELLED" ? "neutral" : "info"; };
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ") : "—";

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const [d, setD] = React.useState<Payload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<CForm | null>(null);
  const [clean, setClean] = React.useState<CForm | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [nc, setNc] = React.useState({ first: "", last: "", email: "", title: "" });

  const load = React.useCallback(() => {
    fetch(`/api/crm/account/${params.id}`).then((r) => r.json()).then((j) => {
      if (j.error) { setD(null); setLoading(false); return; }
      setD(j); const a = j.account;
      const f: CForm = { name: a.name || "", industry: a.industry || "", website: a.website || "", email: a.email || "", phone: a.phone || "", city: a.city || "", country: a.country || "", description: a.description || "" };
      setForm(f); setClean(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);

  const dirty = !!form && !!clean && (Object.keys(form) as (keyof CForm)[]).some((k) => form[k] !== clean[k]);
  const set = (k: keyof CForm, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));
  async function patch(body: Record<string, unknown>) { setBusy(true); try { const r = await fetch(`/api/crm/account/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (r.ok) load(); return r.ok; } finally { setBusy(false); } }
  async function saveForm() { if (!form) return; const ok = await patch(form); if (ok) { setClean(form); setSaved(true); setTimeout(() => setSaved(false), 2000); } }
  async function addNote() { const t = note.trim(); if (!t) return; const ok = await patch({ note: t }); if (ok) setNote(""); }
  async function submitContact() { if (!nc.first.trim()) return; const ok = await patch({ contactFirstName: nc.first.trim(), contactLastName: nc.last.trim(), contactEmail: nc.email.trim(), contactTitle: nc.title.trim() }); if (ok) { setNc({ first: "", last: "", email: "", title: "" }); setAdding(false); } }

  const fieldS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 34, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 10px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };
  const labelS: React.CSSProperties = { display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 4 };
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

  return (
    <AppShell active="companies">
      {/* Identity */}
      <a href="/companies" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: color.ink.mid, textDecoration: "none" }}>← Companies</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "10px 0 14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, background: color.brand.primaryTint, color: color.brand.primary, fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(a.name)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 20, lineHeight: 1.1, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{a.name}</h1>
              {a.industry ? <StatusBadge tone="info" label={a.industry} /> : null}
            </div>
            <div style={{ fontSize: 12.5, color: color.ink.mid, marginTop: 3 }}>Company record{[a.city, a.country].filter(Boolean).length ? ` · ${[a.city, a.country].filter(Boolean).join(", ")}` : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {dirty ? <Button variant="primary" onClick={saveForm} disabled={busy}>{busy ? "Saving…" : "Save"}</Button> : (saved ? <span style={{ fontSize: 12.5, fontWeight: 600, color: color.status.positive }}>✓ Saved</span> : null)}
          <AskAiButton label="Ask AI" seed={`Summarise the relationship with ${a.name} and suggest the next best action.`} />
          {a.website ? <a href={a.website.startsWith("http") ? a.website : `https://${a.website}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Button>Website</Button></a> : null}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {a.phone ? <a href={`tel:${a.phone}`} style={{ textDecoration: "none" }}><Button>☎ Call</Button></a> : null}
        {a.email ? <a href={`mailto:${a.email}`} style={{ textDecoration: "none" }}><Button>@ Email</Button></a> : null}
        {a.phone ? <a href={`https://wa.me/${a.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Button>✆ WhatsApp</Button></a> : null}
        <AskAiButton variant="ghost" label="Draft outreach with AI" seed={`Draft a short outreach message to ${a.name}.`} />
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
            <PanelHeader title="Details" actions={dirty ? <Button variant="primary" onClick={saveForm} disabled={busy}>{busy ? "Saving…" : "Save"}</Button> : (saved ? <span style={{ fontSize: 12, fontWeight: 600, color: color.status.positive }}>✓ Saved</span> : <span style={{ fontSize: 11.5, color: color.ink.soft }}>Edit any field</span>)} />
            <PanelBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div><label style={labelS}>Company name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Industry</label><input value={form.industry} onChange={(e) => set("industry", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Website</label><input value={form.website} onChange={(e) => set("website", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Email</label><input value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Phone</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={fieldS} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={labelS}>City</label><input value={form.city} onChange={(e) => set("city", e.target.value)} style={fieldS} /></div>
                  <div><label style={labelS}>Country</label><input value={form.country} onChange={(e) => set("country", e.target.value)} style={fieldS} /></div>
                </div>
                <div><label style={labelS}>Description</label><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ ...fieldS, height: "auto", padding: 10, resize: "vertical" }} /></div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Contacts" subtitle={`${d.contacts.length}`} actions={<Button onClick={() => setAdding((v) => !v)}>{adding ? "Close" : "+ Add"}</Button>} />
            <PanelBody flush>
              {adding ? (
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: color.surface.page, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input autoFocus value={nc.first} onChange={(e) => setNc({ ...nc, first: e.target.value })} placeholder="First name *" style={{ ...fieldS, height: 32, fontSize: 12.5 }} />
                    <input value={nc.last} onChange={(e) => setNc({ ...nc, last: e.target.value })} placeholder="Last name" style={{ ...fieldS, height: 32, fontSize: 12.5 }} />
                  </div>
                  <input value={nc.title} onChange={(e) => setNc({ ...nc, title: e.target.value })} placeholder="Title (optional)" style={{ ...fieldS, height: 32, fontSize: 12.5 }} />
                  <input value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitContact(); } }} placeholder="Email (optional)" style={{ ...fieldS, height: 32, fontSize: 12.5 }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <Button onClick={() => setAdding(false)} disabled={busy}>Cancel</Button>
                    <Button variant="primary" onClick={submitContact} disabled={busy || !nc.first.trim()}>{busy ? "Saving…" : "Add contact"}</Button>
                  </div>
                </div>
              ) : null}
              {d.contacts.length === 0 && !adding ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No contacts yet. Use “+ Add” to create one.</div>
                : d.contacts.map((p) => (
                  <a key={p.id} href={`/contacts/${p.id}`} className="xui-row-link" style={linkRow}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(p.name)}</span>
                    <span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>{p.title ? <span style={{ display: "block", fontSize: 11, color: color.ink.soft }}>{p.title}</span> : null}</span>
                  </a>
                ))}
            </PanelBody>
          </Panel>
        </div>

        {/* main */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Panel>
            <PanelHeader title="Leads & deals" subtitle={`${d.deals.length} total · ${openDeals.length} open`} />
            <PanelBody flush>
              {d.deals.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No leads linked to this company yet.</div>
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
                {d.conversations.map((cv) => <div key={cv.id} style={{ padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}><div style={{ fontSize: 12.5, fontWeight: 500 }}>{cv.phone} <span style={{ color: color.ink.soft, fontWeight: 400 }}>· {cv.at}</span></div>{cv.body ? <div style={{ fontSize: 11.5, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cv.body}</div> : null}</div>)}
              </PanelBody>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="Timeline" subtitle="Everything across contacts, leads and billing" />
            <PanelBody>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }} placeholder="Add a note…" style={{ flex: 1, height: 34, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" }} />
                <Button variant="primary" onClick={addNote} disabled={busy || !note.trim()}>{busy ? "…" : "Add note"}</Button>
              </div>
              {d.activities.length === 0 ? <div style={{ padding: "12px 0", textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No activity yet.</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{d.activities.map((act) => (
                    <div key={act.id} style={{ display: "flex", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color.brand.primary, marginTop: 5, flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: color.ink.DEFAULT }}>{act.subject || cap(act.type)}</span>
                          <span style={{ fontSize: 11, color: color.ink.soft, marginLeft: "auto", flexShrink: 0 }}>{act.at}</span>
                        </div>
                        {act.content ? <div style={{ fontSize: 12, color: color.ink.mid, marginTop: 2, whiteSpace: "pre-wrap" }}>{act.content}</div> : null}
                      </div>
                    </div>
                  ))}</div>}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
