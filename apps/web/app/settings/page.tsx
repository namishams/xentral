"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge } from "@xentral/ui";

type Cat = { icon: string; title: string; desc: string; href: string; tag?: string };
const CATS: Cat[] = [
  { icon: "▸", title: "Billing & plans", desc: "Subscription, payment method (Telr) & usage.", href: "/billing", tag: "Telr" },
  { icon: "✦", title: "AI Hub", desc: "Providers, API keys, agent models & auto-reply.", href: "/settings/ai-hub", tag: "Live" },
  { icon: "⇄", title: "Integrations", desc: "Connect Google, Slack, WhatsApp and more.", href: "/settings/integrations" },
  { icon: "☷", title: "Users & roles", desc: "Invite teammates, assign roles and seats.", href: "/users" },
  { icon: "◷", title: "Roles & permissions", desc: "Define what each role can see and do.", href: "/roles" },
  { icon: "⚿", title: "Security", desc: "2FA, sessions and sign-in policy.", href: "/security" },
  { icon: "⌗", title: "API keys", desc: "Issue and revoke developer API keys.", href: "/api-keys" },
  { icon: "☎", title: "Channels", desc: "WhatsApp, email and messaging channels.", href: "/inbox" },
  { icon: "⌖", title: "Branches & locations", desc: "Manage your branch hierarchy.", href: "/org/branches" },
  { icon: "⚙", title: "Automations", desc: "Build no-code rules and workflows.", href: "/automations" },
  { icon: "❏", title: "Audit logs", desc: "Review who changed what, and when.", href: "/audit-logs" },
];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 20px" }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: "0 0 4px" }}>{title}</h2>
      {children}
    </section>
  );
}
function Row({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <div style={{ width: 180, flexShrink: 0, fontSize: 13.5, color: color.ink.DEFAULT }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0 }}>{right}</div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppShell active="settings">
      <PageTitleRow title="Settings" subtitle="Workspace, team, security and integrations" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 22 }}>
        {CATS.map((c) => (
          <a key={c.href} href={c.href} style={{ display: "block", textDecoration: "none", background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "16px 18px", transition: "border-color .15s, box-shadow .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = color.brand.primary; e.currentTarget.style.boxShadow = "0 6px 20px -10px rgba(20,28,38,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = color.line.DEFAULT; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: `color-mix(in srgb, ${color.brand.primary} 12%, ${color.surface.card})`, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.icon}</span>
              {c.tag ? <StatusBadge tone="positive" label={c.tag} /> : null}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, marginBottom: 3 }}>{c.title}</div>
            <div style={{ fontSize: 12.5, color: color.ink.mid, lineHeight: 1.45 }}>{c.desc}</div>
          </a>
        ))}
      </div>

      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: color.ink.soft, textTransform: "uppercase", margin: "0 0 10px" }}>Workspace overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
        <Panel title="Workspace">
          <Row label="Workspace name" right={<span style={{ fontSize: 13, color: color.ink.mid }}>Xentral — ICSL</span>} />
          <Row label="Default language" right={<span style={{ fontSize: 13, color: color.ink.mid }}>English · العربية (RTL)</span>} />
          <Row label="Timezone" right={<span style={{ fontSize: 13, color: color.ink.mid }}>Asia/Dubai (GST, UTC+4)</span>} />
          <Row label="Currency" right={<StatusBadge tone="info" label="AED" />} />
        </Panel>
        <Panel title="Regional (UAE)">
          <Row label="VAT registered" right={<span style={{ fontSize: 13, color: color.ink.mid }}>Yes</span>} />
          <Row label="VAT rate" right={<StatusBadge tone="info" label="5%" />} />
          <Row label="Corporate tax" right={<span style={{ fontSize: 13, color: color.ink.mid }}>9% above AED 375k</span>} />
          <Row label="e-Invoicing" right={<StatusBadge tone="warning" label="PINT-AE ready" />} />
        </Panel>
        <Panel title="Branding">
          <Row label="Logo" right={<Button onClick={() => { window.location.href = "/settings/integrations"; }}>Manage branding</Button>} />
          <Row label="Theme" right={<span style={{ fontSize: 13, color: color.ink.mid }}>Light · Dark (auto)</span>} />
          <Row label="Brand colour" right={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 16, height: 16, borderRadius: 4, background: color.brand.primary, display: "inline-block" }} /><span style={{ fontSize: 13, color: color.ink.mid }}>{color.brand.primary}</span></span>} />
        </Panel>
        <Panel title="Members">
          <Row label="Manage members" right={<Button onClick={() => { window.location.href = "/users"; }}>Open users</Button>} />
          <Row label="Roles" right={<Button onClick={() => { window.location.href = "/roles"; }}>Open roles</Button>} />
          <Row label="Invite by domain" right={<StatusBadge tone="neutral" label="off" />} />
        </Panel>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Settings hub · every card links to a working area</p>
    </AppShell>
  );
}
