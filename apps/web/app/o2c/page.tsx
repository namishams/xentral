"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { listLeads, listDeals } from "@xentral/module-crm";
import { listQuotes, listInvoices, listPayments } from "@xentral/module-books";
import { listOrders } from "@xentral/module-erp";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

export default function O2CPage() {
  const leads = listLeads();
  const deals = listDeals().filter((d) => d.stage !== "lost");
  const quotes = listQuotes().filter((q) => q.status === "sent" || q.status === "accepted");
  const orders = listOrders().filter((o) => o.status !== "cancelled");
  const invoices = listInvoices().filter((i) => i.status !== "PAID" && i.status !== "CANCELLED");
  const payments = listPayments().filter((p) => p.status === "received");

  const stages = [
    { id: "lead", label: "Leads", count: leads.length, value: 0, accent: color.status.info, hint: "captured" },
    { id: "deal", label: "Deals", count: deals.length, value: deals.reduce((s, d) => s + d.value, 0), accent: color.brand.primary, hint: "in pipeline" },
    { id: "quote", label: "Quotes", count: quotes.length, value: quotes.reduce((s, q) => s + q.total, 0), accent: color.status.info, hint: "sent" },
    { id: "order", label: "Orders", count: orders.length, value: orders.reduce((s, o) => s + o.total, 0), accent: color.status.critical, hint: "to fulfil" },
    { id: "invoice", label: "Invoices", count: invoices.length, value: invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0), accent: color.status.critical, hint: "outstanding" },
    { id: "payment", label: "Payments", count: payments.length, value: payments.reduce((s, p) => s + p.amount, 0), accent: color.status.positive, hint: "received" },
  ];

  return (
    <AppShell active="o2c">
      <PageTitleRow title="Order-to-Cash" subtitle="The full revenue flow — lead to cash, end to end" actions={<Button variant="primary">+ New deal</Button>} />
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", overflowX: "auto", paddingBottom: 8 }}>
        {stages.map((s, i) => (
          <React.Fragment key={s.id}>
            <div style={{ flex: "1 1 0", minWidth: 150, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 11, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.accent }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{s.label}</span>
              </span>
              <span style={{ fontSize: 24, fontWeight: 700, color: color.ink.DEFAULT, lineHeight: "28px" }}>{s.count}</span>
              <span style={{ fontSize: 13, color: color.ink.mid }}>{s.value > 0 ? aed(s.value) : s.hint}</span>
              <span style={{ fontSize: 11, color: color.ink.soft }}>{s.value > 0 ? s.hint : ""}</span>
            </div>
            {i < stages.length - 1 ? <span style={{ alignSelf: "center", color: color.ink.soft, fontSize: 18, flexShrink: 0 }}>→</span> : null}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 14, marginTop: 18 }}>
        <Section title="Open deals" items={deals.map((d) => ({ k: d.id, a: d.name, b: aed(d.value), href: `/deals/${d.id}` }))} />
        <Section title="Outstanding invoices" items={invoices.map((i) => ({ k: i.id, a: `${i.number} · ${i.customer}`, b: aed(i.total - i.amountPaid), href: `/invoices/${i.id}` }))} />
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Order-to-Cash board · cross-module (crm · books · erp) · tokens-only, theme-aware</p>
    </AppShell>
  );
}

function Section({ title, items }: { title: string; items: { k: string; a: string; b: string; href: string }[] }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "14px 16px" }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: "0 0 8px" }}>{title}</h2>
      {items.length === 0 ? <div style={{ fontSize: 13, color: color.ink.soft }}>Nothing here.</div> :
        items.map((it) => (
          <a key={it.k} href={it.href} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}`, textDecoration: "none" }}>
            <span style={{ fontSize: 13, color: color.ink.DEFAULT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.a}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, flexShrink: 0 }}>{it.b}</span>
          </a>
        ))}
    </section>
  );
}
