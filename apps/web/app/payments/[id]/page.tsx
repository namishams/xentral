"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StatusBadge, type BadgeTone } from "@xentral/ui";
import { listPayments, type PaymentStatus } from "@xentral/module-books";

const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  received: { label: "Received", tone: "positive" },
  pending: { label: "Pending", tone: "warning" },
  failed: { label: "Failed", tone: "critical" },
};

function Panel({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
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

export default function PaymentRecordPage({ params }: { params: { id: string } }) {
  const payments = listPayments();
  const p = payments.find((x) => x.id === params.id) ?? payments[0];
  if (!p) return <AppShell active="payments"><p style={{ fontSize: 13, color: color.ink.soft }}>Payment not found.</p></AppShell>;
  const st = STATUS[p.status];

  return (
    <AppShell active="payments">
      <a href="/payments" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Payments</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0, letterSpacing: "0.02em" }}>{p.ref}</h1>
            <StatusBadge tone={st.tone} label={st.label} />
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{p.customer} · {p.method} · {p.date}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Receipt PDF</Button>
          <Button>Edit</Button>
          <Button>Refund</Button>
          {p.status === "pending" ? <Button variant="primary">Mark received</Button> : <Button variant="primary">Send receipt</Button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Amount" value={aed(p.amount)} note={p.currency} noteTone={color.ink.soft} />
        <KPICard label="Method" value={p.method} note="payment channel" noteTone={color.ink.soft} />
        <KPICard label="Status" value={st.label} note="settlement" noteTone={st.tone === "positive" ? color.status.positive : st.tone === "critical" ? color.status.negative : color.status.critical} />
        <KPICard label="Date" value={p.date} note="2026" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Allocation" sub="Which invoice(s) this payment is applied to">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
              <a href="/invoices" style={{ fontSize: 13.5, fontWeight: 600, color: color.brand.primary, textDecoration: "none" }}>Applied to open invoice ↗</a>
              <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{aed(p.amount)}</span>
            </div>
            <div style={{ fontSize: 12.5, color: color.ink.soft, marginTop: 8 }}>{p.status === "received" ? "Fully reconciled against the customer balance." : p.status === "failed" ? "Payment failed — no allocation made." : "Awaiting confirmation before allocation."}</div>
          </Panel>
          <Panel title="Activity &amp; notes" action={<Button>+ Note</Button>}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 9, display: "flex", alignItems: "center", padding: "0 13px", color: color.ink.soft, fontSize: 13 }}>Add an internal note…</div>
              <Button variant="primary">Add note</Button>
            </div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Summary">
            <SumRow label="Customer"><a href="/companies" style={{ color: color.brand.primary, textDecoration: "none" }}>{p.customer}</a></SumRow>
            <SumRow label="Method">{p.method}</SumRow>
            <SumRow label="Reference">{p.ref}</SumRow>
            <SumRow label="Amount" strong>{aed(p.amount)}</SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — remittance advice.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (payment) · locked AppShell + KPICard + StatusBadge + Button · tokens only</p>
    </AppShell>
  );
}
