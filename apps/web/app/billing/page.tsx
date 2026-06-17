"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge } from "@xentral/ui";

type Plan = { id: string; name: string; price: number; tagline: string; features: string[]; popular?: boolean };
const PLANS: Plan[] = [
  { id: "starter", name: "Starter", price: 199, tagline: "For small teams getting started", features: ["3 seats", "CRM + WhatsApp inbox", "Invoices & quotes", "5,000 AI credits / mo"] },
  { id: "growth", name: "Growth", price: 599, tagline: "For growing sales teams", features: ["15 seats", "Everything in Starter", "Marketplace + campaigns", "Telr online payments", "50,000 AI credits / mo"], popular: true },
  { id: "scale", name: "Scale", price: 1499, tagline: "For multi-branch operations", features: ["Unlimited seats", "Everything in Growth", "Full ERP + ledger", "Branches & roles", "Priority support"] },
];
const aed = (n: number) => `AED ${n.toLocaleString()}`;

function Check() { return <span style={{ color: color.status.positive, fontWeight: 800, marginRight: 8 }}>✓</span>; }

export default function BillingPage() {
  const current = "growth";
  const [selected, setSelected] = React.useState(current);

  return (
    <AppShell active="settings">
      <PageTitleRow title="Billing & plans" subtitle="Your subscription, payment method and usage" />

      {/* Current plan + payment method */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 16, marginBottom: 24 }}>
        <section style={{ background: `linear-gradient(135deg, ${color.brand.primary}, color-mix(in srgb, ${color.brand.primary} 70%, #000))`, color: "#fff", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 12.5, opacity: 0.85, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>Current plan</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "6px 0 2px" }}>
            <span style={{ fontSize: 30, fontWeight: 800 }}>Growth</span>
            <StatusBadge tone="positive" label="active" />
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>{aed(599)} / month · renews 1 Jul 2026</div>
          <div style={{ display: "flex", gap: 24, marginTop: 18 }}>
            <div><div style={{ fontSize: 22, fontWeight: 800 }}>11 / 15</div><div style={{ fontSize: 12, opacity: 0.85 }}>Seats used</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 800 }}>38k / 50k</div><div style={{ fontSize: 12, opacity: 0.85 }}>AI credits</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 800 }}>AED 1.5k</div><div style={{ fontSize: 12, opacity: 0.85 }}>This month</div></div>
          </div>
        </section>
        <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, marginBottom: 14 }}>Payment method</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, marginBottom: 12 }}>
            <span style={{ width: 40, height: 26, borderRadius: 5, background: "#1a1f71", color: "#fff", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>VISA</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT }}>•••• •••• •••• 4242</div><div style={{ fontSize: 12, color: color.ink.soft }}>Expires 08/27</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: color.ink.soft, marginBottom: 14 }}>🔒 Processed securely by <b style={{ color: "#0098a6" }}>telr</b></div>
          <Button onClick={() => { window.location.href = "/settings/integrations"; }}>Manage payment</Button>
        </section>
      </div>

      {/* Plans */}
      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: color.ink.soft, textTransform: "uppercase", margin: "0 0 12px" }}>Choose a plan</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 22 }}>
        {PLANS.map((p) => {
          const on = selected === p.id; const isCurrent = p.id === current;
          return (
            <section key={p.id} onClick={() => setSelected(p.id)} style={{ position: "relative", background: color.surface.card, border: `2px solid ${on ? color.brand.primary : color.line.DEFAULT}`, borderRadius: 14, padding: "20px 20px 22px", cursor: "pointer", transition: "border-color .15s, box-shadow .15s", boxShadow: on ? "0 10px 30px -12px rgba(20,28,38,0.25)" : "none" }}>
              {p.popular ? <span style={{ position: "absolute", top: -11, left: 20, background: color.brand.primary, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>Most popular</span> : null}
              <div style={{ fontSize: 16, fontWeight: 800, color: color.ink.DEFAULT }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: color.ink.mid, margin: "2px 0 14px", minHeight: 32 }}>{p.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: color.ink.DEFAULT }}>{aed(p.price)}</span>
                <span style={{ fontSize: 13, color: color.ink.soft }}>/mo</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
                {p.features.map((f) => <div key={f} style={{ fontSize: 13, color: color.ink.mid, display: "flex" }}><Check />{f}</div>)}
              </div>
              {isCurrent ? <Button disabled>Current plan</Button> : <Button variant="primary">{p.price > 599 ? "Upgrade" : "Switch"} to {p.name}</Button>}
            </section>
          );
        })}
      </div>

      <div style={{ background: color.surface.sunken, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "16px 20px", fontSize: 13, color: color.ink.mid, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>💳</span>
        <span>All subscription and customer payments are processed through <b style={{ color: "#0098a6" }}>Telr</b> — UAE's leading payment gateway. VAT invoices are issued automatically for every charge.</span>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Billing · powered by Telr · AED pricing incl. 5% VAT</p>
    </AppShell>
  );
}
