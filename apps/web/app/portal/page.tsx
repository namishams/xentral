"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { listInvoices, listQuotes } from "@xentral/module-books";

const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: color.surface.page, color: color.ink.DEFAULT, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ height: 56, background: color.surface.card, borderBottom: `1px solid ${color.line.DEFAULT}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, background: color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Xentral <span style={{ color: color.ink.soft, fontWeight: 500 }}>· Customer Portal</span></span>
        </span>
        <span style={{ fontSize: 13, color: color.ink.mid }}>Gulf Trading · <a href="#" style={{ color: color.brand.primary, textDecoration: "none" }}>Sign out</a></span>
      </header>
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "28px 24px" }}>{children}</main>
    </div>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>{children}</section>;
}

export default function PortalPage() {
  const invoices = listInvoices().filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").slice(0, 3);
  const quotes = listQuotes().filter((q) => q.status === "sent").slice(0, 2);
  const due = invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);

  return (
    <Shell>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Welcome back, Gulf Trading</h1>
      <p style={{ fontSize: 14, color: color.ink.mid, margin: "0 0 20px" }}>Your invoices, quotes and documents — all in one place.</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[["Balance due", aed(due), color.status.critical], ["Open quotes", String(quotes.length), color.ink.DEFAULT], ["Documents", "4", color.ink.DEFAULT]].map(([l, v, t]) => (
          <div key={l} style={{ flex: 1, minWidth: 160, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: color.ink.mid }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: t as string }}>{v}</div>
          </div>
        ))}
      </div>

      <Card>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>Outstanding invoices</h2>
        {invoices.map((i) => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
            <span><span style={{ fontWeight: 600, display: "block" }}>{i.number}</span><span style={{ fontSize: 12, color: color.ink.soft }}>due {i.dueDate}</span></span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontWeight: 700 }}>{aed(i.total - i.amountPaid)}</span>
              <a href={`/pay/inv-${i.id}`} style={{ fontSize: 13, fontWeight: 600, background: color.brand.primary, color: color.ink.onPrimary, borderRadius: 8, padding: "7px 14px", textDecoration: "none" }}>Pay now</a>
            </span>
          </div>
        ))}
      </Card>

      <Card>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>Quotes awaiting your approval</h2>
        {quotes.map((q) => (
          <div key={q.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
            <span><span style={{ fontWeight: 600, display: "block" }}>{q.number}</span><span style={{ fontSize: 12, color: color.ink.soft }}>valid until {q.validUntil}</span></span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontWeight: 700 }}>{aed(q.total)}</span>
              <a href={`/q/${q.id}`} style={{ fontSize: 13, fontWeight: 600, border: `1px solid ${color.line.strong}`, color: color.ink.DEFAULT, borderRadius: 8, padding: "7px 14px", textDecoration: "none" }}>Review</a>
            </span>
          </div>
        ))}
      </Card>

      <Card>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Documents</h2>
        <p style={{ fontSize: 13, color: color.ink.soft, margin: 0 }}>Contracts, receipts and statements shared with you appear here.</p>
      </Card>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 8 }}>Customer portal · magic-link access · tokens-only, theme-aware</p>
    </Shell>
  );
}
