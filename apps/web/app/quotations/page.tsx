"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, ExportMenu, KPICard, Button, DataTable, StatusBadge, Panel, PanelHeader, PanelBody, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type Row = { id: string; number: string; customer: string; status: string; total: number | string; currency: string; issued: string | null; valid: string | null; expired?: number };

const N = (v: unknown) => Number(v) || 0;
const aed = (n: number) => `AED ${N(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const aedShort = (n: number) => { n = N(n); return n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${Math.round(n)}`; };
const TONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", ACCEPTED: "positive", REJECTED: "critical", EXPIRED: "neutral", INVOICED: "positive" };
const up = (s: string) => (s || "").toUpperCase();
const initials = (s: string) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const dnum = (s: string | null) => { const t = s ? Date.parse(s) : NaN; return isNaN(t) ? 0 : t; };
const isOpen = (s: string) => s === "DRAFT" || s === "SENT";
const isWon = (s: string) => s === "ACCEPTED" || s === "INVOICED";
const isClosed = (s: string) => s === "REJECTED" || s === "EXPIRED";

const FILTERS: { id: string; label: string; match: (s: string) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "open", label: "Open", match: (s) => isOpen(s) },
  { id: "accepted", label: "Accepted", match: (s) => isWon(s) },
  { id: "closed", label: "Closed", match: (s) => isClosed(s) },
];

export default function QuotationsPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filt, setFilt] = React.useState("all");
  React.useEffect(() => { fetch("/api/books/quotes").then((r) => r.json()).then((d) => { setAll(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const active = FILTERS.find((f) => f.id === filt) ?? FILTERS[0]!;
  const rows = all.filter((r) => active.match(up(r.status)));

  const pipeline = all.filter((r) => isOpen(up(r.status))).reduce((s, r) => s + N(r.total), 0);
  const acceptedVal = all.filter((r) => isWon(up(r.status))).reduce((s, r) => s + N(r.total), 0);
  const acc = all.filter((r) => isWon(up(r.status))).length;
  const closed = all.filter((r) => isClosed(up(r.status))).length;
  const openCount = all.filter((r) => isOpen(up(r.status))).length;
  const winRate = acc + closed > 0 ? Math.round((acc / (acc + closed)) * 100) : 0;
  const expiringCount = all.filter((r) => r.expired).length;
  const totalVal = all.reduce((s, r) => s + N(r.total), 0);
  const pipelinePct = totalVal > 0 ? Math.round((pipeline / totalVal) * 100) : 0;
  const acceptedPct = totalVal > 0 ? Math.round((acceptedVal / totalVal) * 100) : 0;

  const COLS: Column<Row>[] = [
    { key: "number", header: "Quote", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span>, sort: (r) => r.number, filterText: (r) => `${r.number} ${r.customer || ""}` },
    { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}><span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(r.customer)}</span><span style={{ color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.customer || "—"}</span></span>, sort: (r) => (r.customer || "").toLowerCase() },
    { key: "status", header: "Status", width: 116, render: (r) => { const s = up(r.status); const tone = r.expired ? "critical" : (TONE[s] ?? "neutral"); return <StatusBadge tone={tone} label={r.expired ? "expired" : s.toLowerCase()} />; }, sort: (r) => r.status },
    { key: "issued", header: "Issued", width: 116, render: (r) => <span style={{ color: color.ink.mid }}>{r.issued || "—"}</span>, sort: (r) => dnum(r.issued) },
    { key: "valid", header: "Valid until", width: 120, render: (r) => <span style={{ color: r.expired ? color.status.critical : color.ink.mid, fontWeight: r.expired ? 600 : 400 }}>{r.valid || "—"}</span>, sort: (r) => dnum(r.valid) },
    { key: "total", header: "Total", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{aed(N(r.total))}</span>, sort: (r) => N(r.total) },
  ];

  const bar = (label: string, pct: number, c: string) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: color.ink.mid }}>{label}</span><span style={{ fontWeight: 700, color: color.ink.DEFAULT }}>{pct}%</span></div>
      <div style={{ height: 7, borderRadius: 4, background: color.surface.sunken, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: c, borderRadius: 4 }} /></div>
    </div>
  );
  const step = (n: number, title: string, body: string) => (
    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
      <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 999, background: color.brand.primaryTint, color: color.brand.primary, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      <span><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{title}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{body}</span></span>
    </div>
  );

  return (
    <AppShell active="quotations">
      <PageTitleRow title="Offers" subtitle={`${all.length} offer${all.length === 1 ? "" : "s"} · ${aed(pipeline)} in pipeline`} actions={<><ExportMenu entity="quotes" /><Button variant="primary" onClick={() => { window.location.href = "/quotations/new"; }}>+ New quote</Button></>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Pipeline" value={aedShort(pipeline)} note={`${openCount} awaiting reply`} noteTone={color.status.info} />
        <KPICard label="Accepted" value={aedShort(acceptedVal)} note={`${acc} won`} noteTone={color.status.positive} />
        <KPICard label="Win rate" value={`${winRate}%`} note="accepted vs closed" noteTone={winRate >= 50 ? color.status.positive : color.status.critical} />
        <KPICard label="Expiring" value={String(expiringCount)} note={expiringCount ? "past validity" : "none expired"} noteTone={expiringCount ? color.status.critical : color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
            {FILTERS.map((f) => { const on = filt === f.id; return <button key={f.id} onClick={() => setFilt(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>{f.label}</button>; })}
          </div>
          {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
            : rows.length === 0 ? <EmptyState title="No offers" hint="Quotes for your workspace appear here." action={<Button variant="primary" onClick={() => setFilt("all")}>Show all</Button>} />
              : <DataTable<Row> columns={COLS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/quotations/${r.id}`} searchable searchPlaceholder="Search quote # or customer…" title="All offers" initialSort={{ key: "issued", dir: "desc" }} maxHeight={620} />}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Pipeline" />
            <PanelBody>
              <div style={{ fontSize: 30, fontWeight: 800, color: winRate >= 50 ? color.status.positive : color.brand.primary, lineHeight: "34px" }}>{winRate}%</div>
              <div style={{ fontSize: 12, color: color.ink.soft, marginBottom: 14 }}>win rate (accepted vs closed)</div>
              {bar("Open pipeline", pipelinePct, color.status.info)}
              {bar("Accepted", acceptedPct, color.status.positive)}
              <div style={{ fontSize: 12, color: color.ink.soft, marginTop: 6 }}>{aed(pipeline)} open · {aed(acceptedVal)} accepted</div>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="How quoting works" />
            <PanelBody>
              {step(1, "Draft an offer", "Add from catalog with live VAT and totals.")}
              {step(2, "Send for approval", "Customer accepts online; you get notified.")}
              {step(3, "Convert to invoice", "One click turns a won quote into an invoice.")}
              <div style={{ marginTop: 4 }}><Button variant="primary" onClick={() => { window.location.href = "/quotations/new"; }}>+ New quote</Button></div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
