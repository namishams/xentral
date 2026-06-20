"use client";

import * as React from "react";
import { color, shadow } from "@xentral/config";
import { AppShell, KPICard, Button, StatusBadge } from "@xentral/ui";
import { listUsers } from "@xentral/module-platform";

const initials = (name: string) => name === "Nami" ? "N" : name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const ROLE_SCOPE: Record<string, string[]> = {
  owner: ["Full workspace access", "Billing & plan", "Manage members & roles", "All modules"],
  manager: ["Team dashboards & reports", "Approve quotes & bills", "Manage assigned reps", "CRM, Sales, Finance"],
  sales: ["CRM & pipeline", "Create quotes & invoices", "Own records only", "No admin settings"],
};

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "16px 18px", boxShadow: shadow.card }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>{action}
      </div>
      {children}
    </section>
  );
}
function SumRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ fontSize: 13, color: color.ink.soft }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT }}>{children}</span>
    </div>
  );
}

export default function UserRecordPage({ params }: { params: { id: string } }) {
  const users = listUsers();
  const m = users.find((x) => x.id === params.id) ?? users[0];
  if (!m) return <AppShell active="users"><p style={{ fontSize: 13, color: color.ink.soft }}>User not found.</p></AppShell>;
  const scope = ROLE_SCOPE[m.role] ?? ["Standard access"];

  return (
    <AppShell active="users">
      <a href="/users" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Users</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(m.name)}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{m.name}</h1>
              <StatusBadge tone="info" label={m.role} />
              <StatusBadge tone={m.active ? "positive" : "neutral"} label={m.active ? "active" : "inactive"} />
            </div>
            <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{m.email}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Edit</Button>
          <Button>Reset password</Button>
          <Button>{m.active ? "Deactivate" : "Reactivate"}</Button>
          <Button variant="primary">Save</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Role" value={m.role.charAt(0).toUpperCase() + m.role.slice(1)} note="permission level" noteTone={color.ink.soft} />
        <KPICard label="Status" value={m.active ? "Active" : "Inactive"} note="account state" noteTone={m.active ? color.status.positive : color.ink.soft} />
        <KPICard label="Last login" value={m.lastLogin || "—"} note="most recent" noteTone={color.ink.soft} />
        <KPICard label="2FA" value="Email OTP" note="enforced" noteTone={color.status.positive} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Access &amp; permissions" action={<a href="/roles" style={{ fontSize: 13, color: color.brand.primary, textDecoration: "none" }}>Manage roles ↗</a>}>
            {scope.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i === 0 ? "none" : `1px solid ${color.line.DEFAULT}` }}>
                <span style={{ color: color.status.positive, fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 14, color: color.ink.DEFAULT }}>{s}</span>
              </div>
            ))}
          </Panel>
          <Panel title="Recent activity">
            <div style={{ fontSize: 13, color: color.ink.soft }}>Signed in {m.lastLogin || "recently"} · Email OTP verified · UAE region.</div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="Email"><a href={`mailto:${m.email}`} style={{ color: color.brand.primary, textDecoration: "none" }}>{m.email}</a></SumRow>
            <SumRow label="Role">{m.role}</SumRow>
            <SumRow label="Status"><StatusBadge tone={m.active ? "positive" : "neutral"} label={m.active ? "active" : "inactive"} /></SumRow>
            <SumRow label="Last login">{m.lastLogin || "—"}</SumRow>
          </Panel>
          <Panel title="Sessions" action={<Button>Sign out all</Button>}>
            <div style={{ fontSize: 13, color: color.ink.soft, padding: "4px 0" }}>1 active session · this device.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (user) · locked AppShell + KPICard + StatusBadge + Button · tokens only</p>
    </AppShell>
  );
}
