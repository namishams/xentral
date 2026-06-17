"use client";

import * as React from "react";
import { color } from "@xentral/config";

const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LINES = [
  { d: "Scope of work — fixed price", qty: 1, amount: 63809.52 },
  { d: "VAT 5%", qty: 1, amount: 3190.48 },
];

export default function QuoteTokenPage({ params }: { params: { token: string } }) {
  const total = 67000;
  return (
    <div style={{ minHeight: "100vh", background: color.surface.page, color: color.ink.DEFAULT, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 22 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Xentral · Quotation</span>
        </div>
        <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 14, padding: "24px 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Quote Q-3009</div>
              <div style={{ fontSize: 13, color: color.ink.soft }}>For Damac Properties · valid until 28 Jun 2026</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, background: color.brand.primaryTint, color: color.brand.primary, borderRadius: 999, padding: "3px 11px" }}>Awaiting approval</span>
          </div>
          <div style={{ marginTop: 18 }}>
            {LINES.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderTop: `1px solid ${color.line.DEFAULT}`, fontSize: 14 }}>
                <span style={{ color: color.ink.mid }}>{l.d}</span><span style={{ fontWeight: 600 }}>{aed(l.amount)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: `2px solid ${color.line.strong}`, marginTop: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span><span style={{ fontSize: 16, fontWeight: 700 }}>{aed(total)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button style={{ flex: 1, height: 46, borderRadius: 10, border: 0, background: color.status.positive, color: "#fff", fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>✓ Accept quote</button>
            <button style={{ height: 46, padding: "0 18px", borderRadius: 10, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Decline</button>
          </div>
          <div style={{ fontSize: 11.5, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>Accepting converts this quote to an order · link {params.token}</div>
        </div>
        <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 16 }}>Public quote acceptance · token link · tokens-only, theme-aware</p>
      </div>
    </div>
  );
}
