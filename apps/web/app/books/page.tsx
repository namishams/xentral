"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Panel, PanelHeader, PanelBody, StatusBadge, type BadgeTone, AskAiButton } from "@xentral/ui";

type KPIs = { ar: number; overdueAmt: number; overdueCount: number; collected: number; revenueAll: number; vatQuarter: number; pendingQuotesVal: number; pendingQuotesCount: number; draftInvoices: number; invoiceCount: number };
type Aging = { label: string; amount: number; count: number };
type Trend = { label: string; value: number };
type Debtor = { name: string; amount: number; count: number; oldest: number };
type RInv = { id: string; number: string; customer: string; status: string; total: number; balance: number; due: string };
type RQuote = { id: string; number: string; customer: string; status: string; total: number; valid: string };
type Data = { currency: string; kpis: KPIs; aging: Aging[]; trend: Trend[]; debtors: Debtor[]; recentInvoices: RInv[]; recentQuotes: RQuote[] };

const ITONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", OVERDUE: "critical", CANCELLED: "neutral", ACCEPTED: "positive", REJECTED: "critical", VIEWED: "info", EXPIRED: "neutral" };

export default function BooksHomePage() {
  const [d, setD] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/books/command-center").then((r) => r.json()).then((j) => { setD(j.empty ? null : j); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const cur = d?.currency || "AED";
  const aed = (n: number) => `${cur} ${Math.round(Number(n) || 0).toLocaleString()}`;
  const k = d?.kpis;
  const trendMax = Math.max(1, ...(d?.trend || []).map((t) => t.value));
  const agingMax = Math.max(1, ...(d?.aging || []).map((a) => a.amount));

  const card: React.CSSProperties = { background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "14px 16px" };
  const kpi = (label: string, value: string, tone?: "neg" | "pos" | "warn", sub?: string) => (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, color: color.ink.soft }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: tone === "neg" ? color.status.negative : tone === "pos" ? color.status.positive : tone === "warn" ? color.status.critical : color.ink.DEFAULT }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: color.ink.soft, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );

  const AI = ["Which invoices are overdue and what's the total outstanding?", "Draft polite payment reminders for my top overdue customers.", "Summarise my cash flow and what to chase this week.", "How much VAT have I collected this quarter?"];

  return (
    <AppShell active="books">
      <PageTitleRow title="Finance overview" subtitle="Receivables, collections, aging and VAT at a glance"
        actions={<div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => { window.location.href = "/quotations/new"; }}>New quote</Button>
          <Button variant="primary" onClick={() => { window.location.href = "/invoices/new"; }}>New invoice</Button>
        </div>} />

      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div> : !d ? (
        <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>No finance data yet. <a href="/invoices/new" style={{ color: color.brand.primary }}>Create your first invoice →</a></div>
      ) : (
        <>
          {/* AI quick prompts */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "linear-gradient(90deg, #eef4ff, var(--surface-page))", border: `1px solid ${color.line.DEFAULT}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: color.brand.primary }}>Ask Xentral AI:</span>
            {AI.map((q) => <AskAiButton key={q} seed={q} label={q.length > 42 ? q.slice(0, 40) + "…" : q} variant="ghost" />)}
          </div>

          {/* KPI band */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
            {kpi("Outstanding (AR)", aed(k!.ar), k!.ar > 0 ? undefined : "pos", `${k!.invoiceCount} invoices total`)}
            {kpi("Overdue", aed(k!.overdueAmt), k!.overdueAmt > 0 ? "neg" : "pos", `${k!.overdueCount} invoices past due`)}
            {kpi("Collected this month", aed(k!.collected), "pos")}
            {kpi("VAT this quarter", aed(k!.vatQuarter))}
            {kpi("Pending offers", aed(k!.pendingQuotesVal), "warn", `${k!.pendingQuotesCount} awaiting decision`)}
            {kpi("Draft invoices", String(k!.draftInvoices))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginBottom: 16 }}>
            {/* AR Aging */}
            <Panel>
              <PanelHeader title="AR aging" subtitle="Outstanding by days past due" />
              <PanelBody>
                {d.aging.map((a) => (
                  <div key={a.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}><span style={{ color: color.ink.mid }}>{a.label} {a.count ? <span style={{ color: color.ink.soft }}>· {a.count}</span> : null}</span><span style={{ fontWeight: 600, color: a.label === "90+" && a.amount > 0 ? color.status.negative : color.ink.DEFAULT }}>{aed(a.amount)}</span></div>
                    <div style={{ height: 7, borderRadius: 4, background: color.surface.sunken, overflow: "hidden" }}><div style={{ height: "100%", width: `${(a.amount / agingMax) * 100}%`, background: a.label === "Current" ? color.status.positive : a.label === "90+" ? color.status.negative : color.brand.primary }} /></div>
                  </div>
                ))}
              </PanelBody>
            </Panel>

            {/* Revenue trend */}
            <Panel>
              <PanelHeader title="Collected — last 6 months" />
              <PanelBody>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 130, paddingTop: 8 }}>
                  {d.trend.map((t) => (
                    <div key={t.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 11, color: color.ink.soft }}>{t.value ? aed(t.value).replace(cur + " ", "") : ""}</div>
                      <div style={{ width: "70%", height: `${(t.value / trendMax) * 90}px`, minHeight: 3, borderRadius: "5px 5px 0 0", background: color.brand.primary, opacity: 0.85 }} />
                      <div style={{ fontSize: 11, color: color.ink.mid }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              </PanelBody>
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
            {/* Top debtors */}
            <Panel>
              <PanelHeader title="Top debtors" subtitle="Who owes the most" />
              <PanelBody flush>
                {d.debtors.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: color.ink.soft }}>No outstanding balances. 🎉</div>
                  : d.debtors.map((c) => (
                    <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                      <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{c.count} invoice{c.count === 1 ? "" : "s"}{c.oldest > 0 ? ` · ${c.oldest}d overdue` : ""}</span></span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: c.oldest > 30 ? color.status.negative : color.ink.DEFAULT }}>{aed(c.amount)}</span>
                    </div>
                  ))}
              </PanelBody>
            </Panel>

            {/* Recent invoices */}
            <Panel>
              <PanelHeader title="Recent invoices" actions={<a href="/invoices" style={{ fontSize: 12, color: color.brand.primary, textDecoration: "none" }}>All invoices →</a>} />
              <PanelBody flush>
                {d.recentInvoices.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: color.ink.soft }}>No invoices yet.</div>
                  : d.recentInvoices.map((i) => (
                    <a key={i.id} href={`/invoices/${i.id}`} className="xui-row-link" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, textDecoration: "none", color: color.ink.DEFAULT }}>
                      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.number} · {i.customer}</span><span style={{ fontSize: 12, color: color.ink.soft }}>Due {i.due}</span></span>
                      <StatusBadge tone={ITONE[i.status] ?? "neutral"} label={i.status.replace("_", " ").toLowerCase()} />
                      <span style={{ width: 96, textAlign: "right", fontWeight: 600, fontSize: 13 }}>{aed(i.balance > 0 ? i.balance : i.total)}</span>
                    </a>
                  ))}
              </PanelBody>
            </Panel>
          </div>
        </>
      )}
    </AppShell>
  );
}
