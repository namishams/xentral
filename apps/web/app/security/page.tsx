"use client";

import * as React from "react";
import { color, shadow } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge } from "@xentral/ui";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "16px 20px", boxShadow: shadow.card }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: "0 0 4px" }}>{title}</h2>
      {children}
    </section>
  );
}
function Row({ label, hint, right }: { label: string; hint?: string; right: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: color.ink.DEFAULT }}>{label}</div>
        {hint ? <div style={{ fontSize: 12, color: color.ink.soft }}>{hint}</div> : null}
      </div>
      {right}
    </div>
  );
}

export default function SecurityPage() {
  return (
    <AppShell active="security">
      <PageTitleRow title="Security" subtitle="Authentication, sessions and access controls" />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginTop: 8 }}>
        <Panel title="Authentication">
          <Row label="Two-factor authentication" hint="Email OTP enforced for all members" right={<StatusBadge tone="positive" label="enabled" />} />
          <Row label="Single sign-on (SSO)" hint="SAML / OIDC for enterprise" right={<Button>Set up</Button>} />
          <Row label="Password policy" hint="Minimum 12 characters, rotation 90d" right={<StatusBadge tone="positive" label="strong" />} />
        </Panel>
        <Panel title="Sessions">
          <Row label="Session timeout" hint="Auto sign-out after inactivity" right={<span style={{ fontSize: 13, color: color.ink.mid }}>8 hours</span>} />
          <Row label="Active sessions" hint="Across all devices" right={<Button>Review (12)</Button>} />
          <Row label="Force sign-out" hint="Revoke every session now" right={<Button>Sign out all</Button>} />
        </Panel>
        <Panel title="Access control">
          <Row label="IP allowlist" hint="Restrict access to trusted networks" right={<StatusBadge tone="neutral" label="off" />} />
          <Row label="Tenant isolation" hint="Row-level security per workspace" right={<StatusBadge tone="positive" label="enforced" />} />
          <Row label="Audit logging" hint="Immutable, tamper-evident trail" right={<StatusBadge tone="positive" label="on" />} />
        </Panel>
        <Panel title="Data & compliance (UAE)">
          <Row label="Data residency" hint="Where workspace data is stored" right={<span style={{ fontSize: 13, color: color.ink.mid }}>UAE region</span>} />
          <Row label="Encryption at rest" hint="AES-256 for documents & secrets" right={<StatusBadge tone="positive" label="on" />} />
          <Row label="Backups" hint="Daily, 30-day retention" right={<StatusBadge tone="positive" label="active" />} />
        </Panel>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Security center · locked AppShell + Button + StatusBadge · tokens only</p>
    </AppShell>
  );
}
