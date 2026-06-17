import * as React from "react";
import { color, shadow } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, KPICard, Button, StagePill, StatusBadge } from "@xentral/ui";
import { loadLeads } from "@xentral/module-crm";

export const dynamic = "force-dynamic";
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "16px 18px", boxShadow: shadow.card }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>{action}</div>
      {children}
    </section>
  );
}
function SumRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}><span style={{ fontSize: 13, color: color.ink.soft }}>{label}</span><span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT }}>{children}</span></div>;
}

export default async function LeadRecordPage({ params }: { params: { id: string } }) {
  const rows = await loadLeads(await currentScope());
  const l = rows.find((x) => x.id === params.id);
  if (!l) return <AppShell active="leads"><a href="/leads" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Leads</a><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Lead not found.</div></AppShell>;

  return (
    <AppShell active="leads">
      <a href="/leads" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Leads</a>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, margin: "8px 0 18px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(l.name)}</span>
          <div><h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{l.name}</h1><div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{l.company || "—"}</div></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}><StagePill stage={l.stage} /><Button variant="primary">Convert</Button></div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Score" value={String(l.score)} note="lead quality" noteTone={l.score >= 75 ? color.status.positive : l.score >= 50 ? color.status.critical : color.ink.soft} />
        <KPICard label="Source" value={l.source || "—"} note="origin" noteTone={color.ink.soft} />
        <KPICard label="Stage" value={l.stage} note="pipeline" noteTone={color.ink.soft} />
        <KPICard label="Owner" value={l.owner || "Unassigned"} note="assigned to" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <Panel title="Activity & notes" action={<Button>+ Note</Button>}><div style={{ fontSize: 12.5, color: color.ink.soft }}>No activity logged yet.</div></Panel>
        <Panel title="Details">
          <SumRow label="Company">{l.company || "—"}</SumRow>
          <SumRow label="Source">{l.source || "—"}</SumRow>
          <SumRow label="Score">{l.score}</SumRow>
          <SumRow label="Stage"><StagePill stage={l.stage} /></SumRow>
          <SumRow label="Owner">{l.owner ? <StatusBadge tone="info" label={l.owner} /> : "Unassigned"}</SumRow>
        </Panel>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Lead record · live via DataPort · tenant-scoped</p>
    </AppShell>
  );
}
