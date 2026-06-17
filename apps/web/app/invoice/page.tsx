"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { AppShell, DashboardCard, PageTitleRow, StatusBadge } from "@xentral/ui";
import { roundMoney, outstanding } from "@xentral/kernel";

const LINES = [
  { desc: "Brokerage commission", qty: 1, price: 12000 },
  { desc: "Property valuation", qty: 1, price: 2500 },
];
const subtotal = roundMoney(LINES.reduce((s, l) => s + l.qty * l.price, 0));
const vat = roundMoney(subtotal * 0.05);
const total = roundMoney(subtotal + vat);
const amountPaid = 5725;
const balance = outstanding({ total, amountPaid, currency: "AED", status: "PARTIALLY_PAID" });
const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const ACTIONS = ["Record payment", "PDF", "Duplicate", "Pay link", "More"];
const TIMELINE = [["Sent", "10 Jun", color.ink.mid], ["Viewed", "11 Jun", color.ink.mid], ["Paid AED 5,725", "13 Jun", color.status.positive]];

export default function InvoicePage() {
  return (
    <AppShell active="invoice">
      <PageTitleRow
        breadcrumb="Invoices › #1043"
        title="Invoice #1043"
        badge={<StatusBadge tone="warning" label="Partially paid" />}
        actions={<button style={{ height: 32, padding: "0 14px", borderRadius: 8, background: color.brand.primary, color: color.ink.onPrimary, border: 0, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send</button>}
      />

      {/* QuickActionsBar */}
      <div style={{ display: "flex", gap: 8, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 8, padding: "0 12px", height: uiConstants.quickActions.barHeight, alignItems: "center", marginBottom: 16 }}>
        {ACTIONS.map((a, i) => (
          <span key={a} style={{ fontSize: 12.5, color: i === 0 ? color.ink.DEFAULT : color.ink.mid, fontWeight: i === 0 ? 600 : 400, padding: "0 6px" }}>{a}</span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 14 }}>
            <div><div style={{ color: color.ink.soft, fontSize: 11 }}>Bill to</div><div style={{ fontWeight: 600, color: color.ink.DEFAULT }}>Al Noor Real Estate</div><div style={{ color: color.ink.mid }}>Business Bay, Dubai</div></div>
            <div style={{ textAlign: "right" }}><div style={{ color: color.ink.soft, fontSize: 11 }}>Issued · Due</div><div style={{ color: color.ink.DEFAULT }}>10 Jun · 24 Jun 2026</div></div>
          </div>
          <div style={{ display: "flex", fontSize: 11, color: color.ink.mid, borderBottom: `1px solid ${color.line.strong}`, paddingBottom: 6 }}>
            <span style={{ flex: 1 }}>Description</span><span style={{ width: 40, textAlign: "right" }}>Qty</span><span style={{ width: 80, textAlign: "right" }}>Price</span><span style={{ width: 80, textAlign: "right" }}>Total</span>
          </div>
          {LINES.map((l) => (
            <div key={l.desc} style={{ display: "flex", fontSize: 12.5, alignItems: "center", borderBottom: `1px solid ${color.line.DEFAULT}`, height: uiConstants.table.rowHeight.default, color: color.ink.DEFAULT }}>
              <span style={{ flex: 1 }}>{l.desc}</span><span style={{ width: 40, textAlign: "right" }}>{l.qty}</span><span style={{ width: 80, textAlign: "right" }}>{l.price.toLocaleString()}</span><span style={{ width: 80, textAlign: "right" }}>{(l.qty * l.price).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", width: 220, fontSize: 12.5, marginTop: 12 }}>
            <Row label="Subtotal" value={aed(subtotal)} muted />
            <Row label="VAT 5%" value={aed(vat)} muted />
            <Row label="Total" value={aed(total)} bold top />
            <Row label="Paid" value={`− ${aed(amountPaid)}`} cl={color.status.positive} />
            <Row label="Balance due" value={aed(balance)} bold top cl={color.status.critical} />
          </div>
          <div style={{ fontSize: 10.5, color: color.ink.soft, marginTop: 6 }}>Totals computed via @xentral/kernel · outstanding() = {aed(balance)}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <DashboardCard size="medium" title="Balance due" className="!h-auto">
            <div style={{ fontSize: 22, fontWeight: 700, color: color.status.critical }}>{aed(balance)}</div>
            <div style={{ fontSize: 11.5, color: color.ink.mid, marginBottom: 10 }}>Due 24 Jun 2026</div>
            <div style={{ background: color.brand.primaryTint, color: color.brand.primary, borderRadius: 8, textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: 9 }}>Copy pay link</div>
          </DashboardCard>
          <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, marginBottom: 8 }}>Activity</div>
            {TIMELINE.map(([a, b, t2], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, padding: "6px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
                <span style={{ color: t2 as string }}>{a as string}</span><span style={{ color: color.ink.mid }}>{b as string}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, muted, bold, top, cl }: { label: string; value: string; muted?: boolean; bold?: boolean; top?: boolean; cl?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderTop: top ? `1px solid ${color.line.strong}` : undefined, fontWeight: bold ? 600 : 400, color: cl ?? (muted ? color.ink.mid : color.ink.DEFAULT) }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
