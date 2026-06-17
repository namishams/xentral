"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge, type BadgeTone } from "@xentral/ui";

type Conn = { id: string; name: string; cat: string; glyph: string; status: "connected" | "available" };
const CONNS: Conn[] = [
  { id: "shopify", name: "Shopify", cat: "Commerce", glyph: "🛍", status: "connected" },
  { id: "woo", name: "WooCommerce", cat: "Commerce", glyph: "◧", status: "available" },
  { id: "stripe", name: "Stripe", cat: "Payments", glyph: "▭", status: "connected" },
  { id: "telr", name: "Telr", cat: "Payments (UAE)", glyph: "▱", status: "connected" },
  { id: "whatsapp", name: "WhatsApp Business", cat: "Messaging", glyph: "✆", status: "connected" },
  { id: "google", name: "Google Workspace", cat: "Productivity", glyph: "▦", status: "connected" },
  { id: "slack", name: "Slack", cat: "Messaging", glyph: "#", status: "available" },
  { id: "datev", name: "Accounting export", cat: "Finance", glyph: "％", status: "available" },
];
const TONE: Record<Conn["status"], BadgeTone> = { connected: "positive", available: "neutral" };

export default function IntegrationsPage() {
  const connected = CONNS.filter((c) => c.status === "connected").length;
  return (
    <AppShell active="integrations">
      <PageTitleRow title="Integrations" subtitle="Connect Xentral to the tools you already use" actions={<Button variant="primary">Browse all</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Connected" value={String(connected)} note="active integrations" noteTone={color.status.positive} />
        <KPICard label="Available" value={String(CONNS.length - connected)} note="ready to connect" noteTone={color.ink.soft} />
        <KPICard label="Categories" value={String(new Set(CONNS.map((c) => c.cat)).size)} note="commerce, payments…" noteTone={color.ink.soft} />
        <KPICard label="Webhooks" value="6" note="firing" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
        {CONNS.map((c) => (
          <div key={c.id} style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 11, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ width: 38, height: 38, borderRadius: 9, background: color.surface.sunken, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.glyph}</span>
              <StatusBadge tone={TONE[c.status]} label={c.status} />
            </div>
            <div><span style={{ display: "block", fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{c.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{c.cat}</span></div>
            <Button>{c.status === "connected" ? "Manage" : "Connect"}</Button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Integrations · connector gallery · tokens-only, theme-aware</p>
    </AppShell>
  );
}
