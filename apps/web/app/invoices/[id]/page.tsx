"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StatusBadge, DataTable, type Column, type BadgeTone } from "@xentral/ui";
import { listInvoices, type InvoiceStatus } from "@xentral/module-books";

const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SENT: { label: "Sent", tone: "info" },
  PARTIALLY_PAID: { label: "Partially paid", tone: "warning" },
  PAID: { label: "Paid", tone: "positive" },
  CANCELLED: { label: "Cancelled", tone: "critical" },
};

type Line = { n: number; description: string; sub: string; qty: number; unit: number; vat: number; amount: number };

function lineItems(net: number): Line[] {
  // Seeded single line; a real adapter returns the document's actual lines.
  return [{ n: 1, description: "Professional services", sub: "Scope per agreed proposal", qty: 1, unit: net, vat: 5, amount: Math.round(net * 1.05 * 100) / 100 }];
}

function Panel({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>
          {sub ? <div style={{ fontSize: 12.5, color: color.ink.soft, marginTop: 2 }}>{sub}</div> : null}
        </div>
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

export default function InvoiceRecordPage({ params }: { params: { id: string } }) {
  const invoices = listInvoices();
  const inv = invoices.find((x) => x.id === params.id) ?? invoices[0];
  if (!inv) return <AppShell active="invoices"><p style={{ fontSize: 13, color: color.ink.soft }}>Invoice not found.</p></AppShell>;
  const net = Math.round((inv.total / 1.05) * 100) / 100;
  const vat = Math.round((inv.total - net) * 100) / 100;
  const balance = inv.total - inv.amountPaid;
  const st = STATUS[inv.status];
  const lines = lineItems(net);

  const COLUMNS: Column<Line>[] = [
    { key: "n", header: "#", width: 40, render: (r) => <span style={{ color: color.ink.soft }}>{r.n}</span> },
    { key: "description", header: "Description", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.description}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.sub}</span></span> },
    { key: "qty", header: "Qty", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.qty}</span> },
    { key: "unit", header: "Unit", width: 130, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{aed(r.unit)}</span> },
    { key: "vat", header: "VAT", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.vat}%</span> },
    { key: "amount", header: "Amount", width: 140, align: "right", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{aed(r.amount)}</span> },
  ];

  return (
    <AppShell active="invoices">
      <a href="/invoices" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Invoices</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0, letterSpacing: "0.02em" }}>{inv.number}</h1>
            <StatusBadge tone={st.tone} label={st.label} />
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{inv.customer} · issued 17 Jun 2026 · due {inv.dueDate === "—" ? "on send" : inv.dueDate}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>PDF</Button>
          <Button>Print</Button>
          <Button>Edit</Button>
          <Button>Duplicate</Button>
          <Button>Share link</Button>
          <Button variant="primary">Send</Button>
          <Button>Cancel</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Total" value={aed(inv.total)} note={inv.currency} noteTone={color.ink.soft} />
        <KPICard label="Amount paid" value={aed(inv.amountPaid)} note={inv.amountPaid > 0 ? "received" : "nothing yet"} noteTone={color.ink.soft} />
        <KPICard label="Balance due" value={aed(balance)} note={balance > 0 ? "outstanding" : "settled"} noteTone={balance > 0 ? color.status.critical : color.status.positive} />
        <KPICard label="Due date" value={inv.dueDate === "—" ? "On send" : inv.dueDate} note="2026" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="FTA e-Invoice (PINT-AE)" sub="Generate the structured XML, then transmit via your accredited ASP">
            <div style={{ marginBottom: 12 }}><StatusBadge tone="neutral" label="Not generated" /></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <Button>Generate &amp; validate</Button>
              <Button>Download XML</Button>
              <Button variant="primary">Send to FTA (sandbox)</Button>
            </div>
            <div style={{ fontSize: 12, color: color.ink.soft }}>Xentral generates &amp; validates the PINT-AE XML. Live FTA transmission requires an accredited ASP connection.</div>
          </Panel>

          <Panel title="Line items">
            <DataTable columns={COLUMNS} rows={lines} getKey={(r) => String(r.n)} />
          </Panel>

          <Panel title="Activity &amp; notes" sub="Internal notes, approvals and lifecycle — newest first" action={<Button>+ Note</Button>}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 9, display: "flex", alignItems: "center", padding: "0 13px", color: color.ink.soft, fontSize: 13 }}>Add an internal note for your team…</div>
              <Button variant="primary">Add note</Button>
            </div>
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Summary">
            <SumRow label="Subtotal">{aed(net)}</SumRow>
            <SumRow label="VAT 5%">{aed(vat)}</SumRow>
            <SumRow label="Total" strong>{aed(inv.total)}</SumRow>
            <SumRow label="Customer"><a href="/companies" style={{ color: color.brand.primary, textDecoration: "none" }}>{inv.customer}</a></SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — contracts, LPOs, delivery notes.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (invoice) · FTA PINT-AE · locked AppShell + KPICard + DataTable + Button · tokens only</p>
    </AppShell>
  );
}
