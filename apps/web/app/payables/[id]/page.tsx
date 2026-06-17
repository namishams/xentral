"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StatusBadge, DataTable, type Column, type BadgeTone } from "@xentral/ui";
import { listBills, type BillStatus } from "@xentral/module-erp";

const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS: Record<BillStatus, { label: string; tone: BadgeTone }> = {
  open: { label: "Open", tone: "info" },
  approved: { label: "Approved", tone: "warning" },
  overdue: { label: "Overdue", tone: "critical" },
  paid: { label: "Paid", tone: "positive" },
};

type Line = { n: number; description: string; qty: number; unit: number; vat: number; amount: number };

function Panel({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div><h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>{sub ? <div style={{ fontSize: 12.5, color: color.ink.soft, marginTop: 2 }}>{sub}</div> : null}</div>
        {action}
      </div>
      {children}
    </section>
  );
}
function SumRow({ label, children, strong }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ fontSize: strong ? 14 : 13, fontWeight: strong ? 600 : 400, color: strong ? color.ink.DEFAULT : color.ink.soft }}>{label}</span>
      <span style={{ fontSize: strong ? 15 : 13, fontWeight: strong ? 700 : 500, color: color.ink.DEFAULT }}>{children}</span>
    </div>
  );
}

export default function BillRecordPage({ params }: { params: { id: string } }) {
  const bills = listBills();
  const b = bills.find((x) => x.id === params.id) ?? bills[0];
  if (!b) return <AppShell active="payables"><p style={{ fontSize: 13, color: color.ink.soft }}>Bill not found.</p></AppShell>;
  const net = Math.round((b.amount / 1.05) * 100) / 100;
  const vat = Math.round((b.amount - net) * 100) / 100;
  const st = STATUS[b.status];
  const lines: Line[] = [{ n: 1, description: "Supplier charge", qty: 1, unit: net, vat: 5, amount: Math.round(net * 1.05 * 100) / 100 }];

  const COLUMNS: Column<Line>[] = [
    { key: "n", header: "#", width: 40, render: (r) => <span style={{ color: color.ink.soft }}>{r.n}</span> },
    { key: "description", header: "Description", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.description}</span> },
    { key: "qty", header: "Qty", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.qty}</span> },
    { key: "unit", header: "Unit", width: 130, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{aed(r.unit)}</span> },
    { key: "vat", header: "VAT", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.vat}%</span> },
    { key: "amount", header: "Amount", width: 140, align: "right", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{aed(r.amount)}</span> },
  ];

  return (
    <AppShell active="payables">
      <a href="/payables" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Payables</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0, letterSpacing: "0.02em" }}>{b.number}</h1>
            <StatusBadge tone={st.tone} label={st.label} />
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{b.supplier} · due {b.dueDate}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>PDF</Button>
          <Button>Edit</Button>
          <Button>Approve</Button>
          <Button variant="primary">Record payment</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Amount" value={aed(b.amount)} note={b.currency} noteTone={color.ink.soft} />
        <KPICard label="Status" value={st.label} note="approval" noteTone={color.ink.soft} />
        <KPICard label="Due date" value={b.dueDate} note="2026" noteTone={b.status === "overdue" ? color.status.negative : color.ink.soft} />
        <KPICard label="VAT 5%" value={aed(vat)} note="recoverable" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Line items"><DataTable columns={COLUMNS} rows={lines} getKey={(r) => String(r.n)} /></Panel>
          <Panel title="Approval" sub="Three-way match and sign-off before payment">
            <div style={{ marginBottom: 8 }}><StatusBadge tone={st.tone} label={st.label} /></div>
            <div style={{ fontSize: 12.5, color: color.ink.soft }}>{b.status === "paid" ? "Paid in full." : b.status === "overdue" ? "Overdue — prioritise payment to avoid late fees." : "Awaiting approval before scheduling payment."}</div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Summary">
            <SumRow label="Subtotal">{aed(net)}</SumRow>
            <SumRow label="VAT 5%">{aed(vat)}</SumRow>
            <SumRow label="Total" strong>{aed(b.amount)}</SumRow>
            <SumRow label="Supplier"><a href="/suppliers" style={{ color: color.brand.primary, textDecoration: "none" }}>{b.supplier}</a></SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — supplier invoice, GRN.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (bill / AP) · locked AppShell + KPICard + DataTable + Button · tokens only</p>
    </AppShell>
  );
}
