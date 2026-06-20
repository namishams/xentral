"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { listSuppliers, listBills } from "@xentral/module-erp";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

export default function P2PPage() {
  const suppliers = listSuppliers();
  const bills = listBills();
  const open = bills.filter((b) => b.status === "open");
  const approved = bills.filter((b) => b.status === "approved");
  const overdue = bills.filter((b) => b.status === "overdue");
  const paid = bills.filter((b) => b.status === "paid");

  const stages = [
    { id: "sup", label: "Suppliers", count: suppliers.length, value: 0, accent: color.status.info, hint: "vendors" },
    { id: "open", label: "Open bills", count: open.length, value: open.reduce((s, b) => s + b.amount, 0), accent: color.brand.primary, hint: "to review" },
    { id: "appr", label: "Approved", count: approved.length, value: approved.reduce((s, b) => s + b.amount, 0), accent: color.status.critical, hint: "to pay" },
    { id: "over", label: "Overdue", count: overdue.length, value: overdue.reduce((s, b) => s + b.amount, 0), accent: color.status.negative, hint: "urgent" },
    { id: "paid", label: "Paid", count: paid.length, value: paid.reduce((s, b) => s + b.amount, 0), accent: color.status.positive, hint: "settled" },
  ];

  const B_TONE: Record<string, string> = { open: color.status.info, approved: color.status.critical, overdue: color.status.negative, paid: color.status.positive };

  return (
    <AppShell active="p2p">
      <PageTitleRow title="Procure-to-Pay" subtitle="Supplier to settlement — purchasing and payables flow" actions={<Button variant="primary">+ New bill</Button>} />
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", overflowX: "auto", paddingBottom: 8 }}>
        {stages.map((s, i) => (
          <React.Fragment key={s.id}>
            <div style={{ flex: "1 1 0", minWidth: 150, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 11, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: s.accent }} /><span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{s.label}</span></span>
              <span style={{ fontSize: 24, fontWeight: 700, color: color.ink.DEFAULT, lineHeight: "28px" }}>{s.count}</span>
              <span style={{ fontSize: 13, color: color.ink.mid }}>{s.value > 0 ? aed(s.value) : s.hint}</span>
            </div>
            {i < stages.length - 1 ? <span style={{ alignSelf: "center", color: color.ink.soft, fontSize: 18, flexShrink: 0 }}>→</span> : null}
          </React.Fragment>
        ))}
      </div>

      <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "14px 16px", marginTop: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: "0 0 8px" }}>Bills to action</h2>
        {bills.filter((b) => b.status !== "paid").map((b) => (
          <a key={b.id} href={`/payables/${b.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderTop: `1px solid ${color.line.DEFAULT}`, textDecoration: "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: B_TONE[b.status] }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{b.number}</span>
              <span style={{ fontSize: 13, color: color.ink.soft }}>{b.supplier} · {b.status}</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{aed(b.amount)} · due {b.dueDate}</span>
          </a>
        ))}
      </section>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Procure-to-Pay board · @xentral/module-erp · tokens-only, theme-aware</p>
    </AppShell>
  );
}
