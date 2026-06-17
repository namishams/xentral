import * as React from "react";
import { color, shadow } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, KPICard, Button, StatusBadge } from "@xentral/ui";
import { loadCompanies } from "@xentral/module-crm";

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

export default async function CompanyRecordPage({ params }: { params: { id: string } }) {
  const rows = await loadCompanies(await currentScope());
  const c = rows.find((x) => x.id === params.id);
  if (!c) return <AppShell active="companies"><a href="/companies" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Companies</a><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Company not found.</div></AppShell>;

  return (
    <AppShell active="companies">
      <a href="/companies" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Companies</a>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, margin: "8px 0 18px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: 10, background: color.surface.sunken, color: color.ink.mid, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(c.name)}</span>
          <div><h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{c.name}</h1><div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{[c.industry, c.city].filter(Boolean).join(" · ") || "—"}</div></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}><Button>Edit</Button><Button variant="primary">+ New deal</Button></div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Open deals" value={String(c.openDeals)} note="active" noteTone={color.status.positive} />
        <KPICard label="Industry" value={c.industry || "—"} note="segment" noteTone={color.ink.soft} />
        <KPICard label="City" value={c.city || "—"} note="location" noteTone={color.ink.soft} />
        <KPICard label="Owner" value={c.owner || "Unassigned"} note="account owner" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <Panel title="Activity & notes" action={<Button>+ Note</Button>}><div style={{ fontSize: 12.5, color: color.ink.soft }}>No activity logged yet.</div></Panel>
        <Panel title="Details">
          <SumRow label="Industry">{c.industry || "—"}</SumRow>
          <SumRow label="City">{c.city || "—"}</SumRow>
          <SumRow label="Open deals">{c.openDeals}</SumRow>
          <SumRow label="Owner">{c.owner ? <StatusBadge tone="info" label={c.owner} /> : "Unassigned"}</SumRow>
        </Panel>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Company record · live via DataPort · tenant-scoped</p>
    </AppShell>
  );
}
