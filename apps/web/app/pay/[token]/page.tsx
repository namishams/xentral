"use client";

import * as React from "react";
import { color } from "@xentral/config";

const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PayTokenPage({ params }: { params: { token: string } }) {
  const amount = 12600;
  return (
    <div style={{ minHeight: "100vh", background: color.surface.page, color: color.ink.DEFAULT, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 24 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Xentral · Secure payment</span>
      </div>
      <div style={{ width: "100%", maxWidth: 440, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 14, padding: "24px 24px 20px", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, color: color.ink.soft }}>Invoice INV-1044 · Gulf Trading</div>
        <div style={{ fontSize: 34, fontWeight: 700, margin: "6px 0 2px" }}>{aed(amount)}</div>
        <div style={{ fontSize: 12.5, color: color.ink.soft, marginBottom: 18 }}>incl. 5% VAT · due 01 Jul 2026</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={{ height: 46, borderRadius: 10, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Pay by card</button>
          <button style={{ height: 46, borderRadius: 10, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Pay with Telr</button>
          <button style={{ height: 46, borderRadius: 10, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Bank transfer details</button>
        </div>
        <div style={{ fontSize: 11.5, color: color.ink.soft, textAlign: "center", marginTop: 16 }}>🔒 Secured payment · link {params.token}</div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, marginTop: 18 }}>Public pay page · token link · tokens-only, theme-aware</p>
    </div>
  );
}
