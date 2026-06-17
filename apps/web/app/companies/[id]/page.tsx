"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, type BadgeTone, Panel, PanelHeader, PanelBody, AskAiButton } from "@xentral/ui";

type Contact = { id: string; name: string; title: string | null; email: string | null; phone: string | null };
type Deal = { id: string; name: string; status: string; value: number | null; currency: string | null };
type Doc = { id: string; number: string; status: string; total: number; paid?: number; currency: string | null };
type Act = { id: string; type: string; subject: string | null; content: string | null; at: string };
type Account = { id: string; name: string; industry: string | null; website: string | null; phone: string | null; email: string | null; city: string | null; country: string | null; description: string | null };
type Payload = { account: Account; contacts: Contact[]; deals: Deal[]; invoices: Doc[]; quotes: Doc[]; activities: Act[] };

const initials = (n: string) => n.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const aed = (v: number | null | undefined, c = "AED") => `${c} ${(Number(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const OPEN_DEAL = (s: string) => !["WON", "LOST", "UNQUALIFIED"].includes((s || "").toUpperCase());
const dealTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "WON" ? "positive" : u === "LOST" || u === "UNQUALIFIED" ? "critical" : u === "NEGOTIATION" || u === "PROPOSAL" ? "warning" : "info"; };
const invTone = (s: string): BadgeTone => { const u = (s || "").toUpperCase(); return u === "PAID" ? "positive" : u === "OVERDUE" ? "critical" : u === "PARTIALLY_PAID" ? "warning" : u === "CANCELLED" ? "neutral" : "info"; };
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ") : "—";

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const [d, setD] = React.useState<Payload | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch(`/api/crm/account/${params.id}`).then((r) => r.json()).then((j) => { setD(j.error ? null : j); setLoading(false); }).catch(() => setLoading(false)); }, [params.id]);

  if (loading) return <AppShell active="companies"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!d) return <AppShell active="companies"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Company not found. <a href="/companies" style={{ color: color.brand.primary }}>Back to companies</a></div></AppShell>;

  const a = d.account;
  const openDeals = d.deals.filter((x) => OPEN_DEAL(x.status));
  const pipeline = openDeals.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const revenue = d.invoices.reduce((s, x) => s + (Number(x.paid) || 0), 0);
  const outstanding = d.invoices.filter((x) => ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes((x.status || "").toUpperCase())).reduce((s, x) => s + (Number(x.total) - (Number(x.paid) || 0)), 0);

  const metrics = [
    { label: "Revenue", value: revenue > 0 ? aed(revenue) : "—", tone: color.status.positive },
    { label: "Outstanding", value: outstanding > 0 ? aed(outstanding) : "—", tone: outstanding > 0 ? color.status.critical : color.ink.DEFAULT },
    { label: "Open deals", value: openDeals.length ? `${openDeals.length} · ${aed(pipeline)}` : "—", tone: color.ink.DEFAULT },
    { label: "Contacts", value: String(d.contacts.length), tone: color.ink.DEFAULT },
    { label: "Last activity", value: d.activities[0]?.at?.split(",")[0] ?? "—", tone: color.ink.DEFAULT },
  ];

  const linkRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, textDecoration: "none", color: color.ink.DEFAULT, fontSize: 13 };
  const detail = (k: string, v: React.ReactNode) => <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 13 }}><span style={{ color: color.ink.soft }}>{k}</span><span style={{ color: color.ink.DEFAULT, fontWeight: 500, textAlign: "right", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span></div>;

  return (
    <AppShell active="companies">
      <PageTitleRow title={a.name} breadcrumb="CRM · Companies"
        badge={a.industry ? <StatusBadge tone="info" label={a.industry} /> : null}
        actions={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <AskAiButton label="Ask AI" seed={`Summarise the relationship with ${a.name} and suggest the next best action.`} />
          {a.website ? <a href={a.website.startsWith("http") ? a.website : `https://${a.website}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Button>Website</Button></a> : null}
          <Button variant="primary">+ New deal</Button>
        </div>} />

      <Panel style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: `1px solid ${color.line.DEFAULT}`, flexWrap: "wrap" }}>
          <span style={{ width: 52, height: 52, borderRadius: 12, background: color.brand.primaryTint, color: color.brand.primary, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(a.name)}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: color.ink.DEFAULT }}>{a.name}</div>
            <div style={{ fontSize: 12.5, color: color.ink.mid }}>{[a.industry, [a.city, a.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "Company record"}</div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Details" />
            <PanelBody>
              {detail("Industry", a.industry || "—")}
              {detail("Website", a.website ? <a href={a.website.startsWith("http") ? a.website : `https://${a.website}`} target="_blank" rel="noreferrer" style={{ color: color.brand.primary, textDecoration: "none" }}>{a.website}</a> : "—")}
              {detail("Email", a.email ? <a href={`mailto:${a.email}`} style={{ color: color.brand.primary, textDecoration: "none" }}>{a.email}</a> : "—")}
              {detail("Phone", a.phone || "—")}
              {detail("City", a.city || "—")}
              {detail("Country", a.country || "—")}
              {a.description ? <div style={{ marginTop: 8, fontSize: 12.5, color: color.ink.mid, lineHeight: 1.5 }}>{a.description}</div> : null}
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Contacts" subtitle={`${d.contacts.length}`} />
            <PanelBody flush>
              {d.contacts.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No contacts linked.</div>
                : d.contacts.map((p) => (
                  <a key={p.id} href={`/contacts/${p.id}`} className="xui-row-link" style={linkRow}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(p.name)}</span>
                    <span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>{p.title ? <span style={{ display: "block", fontSize: 11, color: color.ink.soft }}>{p.title}</span> : null}</span>
                  </a>
                ))}
            </PanelBody>
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Panel>
            <PanelHeader title="Deals" subtitle={`${d.deals.length} total · ${openDeals.length} open`} />
            <PanelBody flush>
              {d.deals.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No deals yet.</div>
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

          <Panel>
            <PanelHeader title="Timeline" subtitle="Across contacts, deals and billing" />
            <PanelBody>
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
