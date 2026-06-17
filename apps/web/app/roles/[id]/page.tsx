"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button } from "@xentral/ui";
import { listRoles } from "@xentral/module-platform";

const MODULES = ["CRM & pipeline", "Sales & quotes", "Finance & invoicing", "Inventory & purchasing", "Communication", "Reports & analytics", "Members & roles", "Workspace settings"];
function grants(roleId: string): boolean[] {
  const map: Record<string, boolean[]> = {
    owner: [true, true, true, true, true, true, true, true],
    admin: [true, true, true, true, true, true, true, true],
    manager: [true, true, true, true, true, true, false, false],
    sales: [true, true, false, false, true, false, false, false],
  };
  return map[roleId] ?? [true, true, false, false, true, false, false, false];
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
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

export default function RoleRecordPage({ params }: { params: { id: string } }) {
  const roles = listRoles();
  const r = roles.find((x) => x.id === params.id) ?? roles[0];
  if (!r) return <AppShell active="roles"><p style={{ fontSize: 13, color: color.ink.soft }}>Role not found.</p></AppShell>;
  const g = grants(r.id);

  return (
    <AppShell active="roles">
      <a href="/roles" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Roles</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{r.name}</h1>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{r.scope} · {r.members} member(s)</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Duplicate</Button>
          <Button>Edit</Button>
          <Button variant="primary">Save</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Members" value={String(r.members)} note="assigned" noteTone={color.ink.soft} />
        <KPICard label="Permissions" value={String(r.permissions)} note="granted" noteTone={color.ink.soft} />
        <KPICard label="Modules" value={`${g.filter(Boolean).length}/${MODULES.length}`} note="accessible" noteTone={color.ink.soft} />
        <KPICard label="Scope" value={r.scope} note="reach" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Module access">
            {MODULES.map((mod, i) => (
              <div key={mod} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${color.line.DEFAULT}` }}>
                <span style={{ fontSize: 13.5, color: color.ink.DEFAULT }}>{mod}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: g[i] ? color.status.positive : color.ink.soft }}>{g[i] ? "✓ Allowed" : "— No access"}</span>
              </div>
            ))}
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="Scope">{r.scope}</SumRow>
            <SumRow label="Members">{r.members}</SumRow>
            <SumRow label="Permissions">{r.permissions}</SumRow>
          </Panel>
          <Panel title="Members" action={<a href="/users" style={{ fontSize: 12.5, color: color.brand.primary, textDecoration: "none" }}>Manage ↗</a>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>{r.members} member(s) hold this role.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (role) · locked AppShell + KPICard + Button · tokens only</p>
    </AppShell>
  );
}
