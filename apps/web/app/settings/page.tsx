"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Input, StatusBadge } from "@xentral/ui";

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
      <PageTitleRow title="Settings" subtitle="Workspace, regional and branding" actions={<Button variant="primary">Save changes</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginTop: 8 }}>
        <Panel title="Workspace">
          <Row label="Workspace name" right={<Input value="Xentral — ICSL" onChange={() => {}} style={{ width: "100%" }} />} />
          <Row label="Default language" right={<span style={{ fontSize: 13, color: color.ink.mid }}>English · العربية (RTL)</span>} />
          <Row label="Timezone" right={<span style={{ fontSize: 13, color: color.ink.mid }}>Asia/Dubai (GST, UTC+4)</span>} />
          <Row label="Currency" right={<StatusBadge tone="info" label="AED" />} />
        </Panel>
        <Panel title="Regional (UAE)">
          <Row label="VAT registered" right={<span style={{ fontSize: 13, color: color.ink.mid }}>Yes · TRN 100xxxxxxxxxxx3</span>} />
          <Row label="VAT rate" right={<StatusBadge tone="info" label="5%" />} />
          <Row label="Corporate tax" right={<span style={{ fontSize: 13, color: color.ink.mid }}>9% above AED 375k</span>} />
          <Row label="e-Invoicing" right={<StatusBadge tone="warning" label="PINT-AE ready" />} />
        </Panel>
        <Panel title="Branding">
          <Row label="Logo" right={<Button>Upload logo</Button>} />
          <Row label="Theme" right={<span style={{ fontSize: 13, color: color.ink.mid }}>Light · Dark (auto)</span>} />
          <Row label="Brand colour" right={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 16, height: 16, borderRadius: 4, background: color.brand.primary, display: "inline-block" }} /><span style={{ fontSize: 13, color: color.ink.mid }}>{color.brand.primary}</span></span>} />
        </Panel>
        <Panel title="Members">
          <Row label="Seats" right={<span style={{ fontSize: 13, color: color.ink.mid }}>16 used · 25 plan</span>} />
          <Row label="Invite by domain" right={<StatusBadge tone="neutral" label="off" />} />
          <Row label="Manage members" right={<Button>Open users</Button>} />
        </Panel>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Workspace settings · locked AppShell + Input + Button + StatusBadge · tokens only</p>
    </AppShell>
  );
}
