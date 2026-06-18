"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, Panel, PanelHeader, PanelBody, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type Row = { id: string; number: string; customer: string; status: string; total: number | string; amountPaid: number | string; currency: string; issued: string | null; due: string | null; overdue?: number };

const N = (v: unknown) => Number(v) || 0;
const aed = (n: number) => `AED ${N(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const aedShort = (n: number) => { n = N(n); return n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${Math.round(n)}`; };
const TONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", CANCELLED: "neutral", OVERDUE: "critical" };
const bal = (r: Row) => Math.max(0, N(r.total) - N(r.amountPaid));
const isOpen = (s: string) => s === "SENT" || s === "PARTIALLY_PAID" || s === "OVERDUE";
const initials = (s: string) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const dnum = (s: string | null) => { const t = s ? Date.parse(s) : NaN; return isNaN(t) ? 0 : t; };

const FILTERS: { id: string; label: string; match: (s: string) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "open", label: "Outstanding", match: (s) => isOpen(s) },
  { id: "paid", label: "Paid", match: (s) => s === "PAID" },
  { id: "draft", label: "Drafts", match: (s) => s === "DRAFT" },
];

export default function InvoicesPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filt, setFilt] = React.useState("all");
  React.useEffect(() => { fetch("/api/books/invoices").then((r) => r.json()).then((d) => { setAll(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const active = FILTERS.find((f) => f.id === filt) ?? FILTERS[0]!;
  const rows = all.filter((r) => active.match((r.status || "").toUpperCase()));

  // Correct money math — Postgres numerics arrive as strings, so coerce everything.
  const billed = all.filter((r) => (r.status || "").toUpperCase() !== "CANCELLED").reduce((s, r) => s + N(r.total), 0);
  const collected = all.reduce((s, r) => s + N(r.amountPaid), 0);
  const outstanding = all.filter((r) => isOpen((r.status || "").toUpperCase())).reduce((s, r) => s + bal(r), 0);
  const overdueAmt = all.filter((r) => r.overdue).reduce((s, r) => s + bal(r), 0);
  const overdueCount = all.filter((r) => r.overdue).length;
  const collectedPct = billed > 0 ? Math.round((collected / billed) * 100) : 0;
  const outstandingPct = billed > 0 ? Math.round((outstanding / billed) * 100) : 0;
  const overduePct = billed > 0 ? Math.round((overdueAmt / billed) * 100) : 0;
  const customers = new Set(all.map((r) => r.customer)).size;

  const COLS: Column<Row>[] = [
    { key: "number", header: "Invoice", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span>, sort: (r) => r.number, filterText: (r) => `${r.number} ${r.customer || ""}` },
    { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}><span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(r.customer)}</span><span style={{ color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.customer || "—"}</span></span>, sort: (r) => (r.customer || "").toLowerCase() },
    { key: "status", header: "Status", width: 116, render: (r) => { const s = (r.status || "").toUpperCase(); const tone = r.overdue ? "critical" : (TONE[s] ?? "neutral"); return <StatusBadge tone={tone} label={r.overdue ? "overdue" : s.replace("_", " ").toLowerCase()} />; }, sort: (r) => r.status },
    { key: "issued", header: "Issued", width: 116, render: (r) => <span style={{ color: color.ink.mid }}>{r.issued || "—"}</span>, sort: (r) => dnum(r.issued) },
    { key: "due", header: "Due", width: 116, render: (r) => <span style={{ color: r.overdue ? color.status.critical : color.ink.mid, fontWeight: r.overdue ? 600 : 400 }}>{r.due || "—"}</span>, sort: (r) => dnum(r.due) },
    { key: "total", header: "Total", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{aed(N(r.total))}</span>, sort: (r) => N(r.total) },
    { key: "balance", header: "Balance", width: 120, align: "right", render: (r) => <span style={{ color: bal(r) > 0 ? color.status.critical : color.ink.soft, fontWeight: bal(r) > 0 ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{aed(bal(r))}</span>, sort: (r) => bal(r) },
  ];

  const bar = (label: string, pct: number, c: string) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: color.ink.mid }}>{label}</span><span style={{ fontWeight: 700, color: color.ink.DEFAULT }}>{pct}%</span></div>
      <div style={{ height: 7, borderRadius: 4, background: color.surface.sunken, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: c, borderRadius: 4 }} /></div>
    </div>
  );

  const step = (n: number, title: string, body: string) => (
    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
      <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 999, background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      <span><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{title}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{body}</span></span>
    </div>
  );

  return (
    <AppShell active="invoice">
      <PageTitleRow title="Invoices" subtitle={`${all.length} invoice${all.length === 1 ? "" : "s"} · ${aed(outstanding)} outstanding`} actions={<Button variant="primary" onClick={() => { window.location.href = "/invoices/new"; }}>+ New invoice</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Total billed" value={aedShort(billed)} note={`${all.length} invoices`} noteTone={color.ink.soft} />
        <KPICard label="Collected" value={aedShort(collected)} note={`${collectedPct}% of billed`} noteTone={color.status.positive} />
        <KPICard label="Outstanding" value={aedShort(outstanding)} note="to collect" noteTone={color.status.critical} />
        <KPICard label="Overdue" value={aedShort(overdueAmt)} note={overdueCount ? `${overdueCount} past due` : "nothing overdue"} noteTone={overdueAmt > 0 ? color.status.negative : color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
            {FILTERS.map((f) => { const on = filt === f.id; return <button key={f.id} onClick={() => setFilt(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>{f.label}</button>; })}
          </div>
          {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
            : rows.length === 0 ? <EmptyState title="No invoices" hint="Invoices for your workspace appear here." action={<Button variant="primary" onClick={() => setFilt("all")}>Show all</Button>} />
              : <DataTable<Row> columns={COLS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/invoices/${r.id}`} searchable searchPlaceholder="Search invoice # or customer…" title="All invoices" initialSort={{ key: "issued", dir: "desc" }} maxHeight={620} />}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Collections" />
            <PanelBody>
              <div style={{ fontSize: 30, fontWeight: 800, color: color.status.positive, lineHeight: "34px" }}>{collectedPct}%</div>
              <div style={{ fontSize: 12, color: color.ink.soft, marginBottom: 14 }}>collected of billed</div>
              {bar("Outstanding", outstandingPct, color.status.critical)}
              {bar("Overdue", overduePct, color.status.negative)}
              <div style={{ fontSize: 11.5, color: color.ink.soft, marginTop: 6 }}>{aed(outstanding)} outstanding · {aed(overdueAmt)} overdue · {customers} customer{customers === 1 ? "" : "s"}</div>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="How invoicing works" />
            <PanelBody>
              {step(1, "Create an invoice", "Premium PDF + email delivery built in.")}
              {step(2, "Get paid faster", "Send a payment link; track views and status.")}
              {step(3, "Reconcile automatically", "Payments post straight to your ledger.")}
              <div style={{ marginTop: 4 }}><Button variant="primary" onClick={() => { window.location.href = "/invoices/new"; }}>+ New invoice</Button></div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
