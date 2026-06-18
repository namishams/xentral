"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, DataTable, Button, EmptyState, type Column } from "@xentral/ui";

type Tenant = { id: string; name: string; credits: number; users: number; contacts: number; joined: string };
type Supply = { listed: number; available: number; purchases: number; value: number };
type Totals = { tenants: number; users: number; credits: number };

const aed = (n: number) => `AED ${(Number(n) || 0).toLocaleString()}`;
const TABS = ["Overview", "Tenants", "Marketplace supply"] as const;

export default function AdminPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Overview");
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [supply, setSupply] = React.useState<Supply>({ listed: 0, available: 0, purchases: 0, value: 0 });
  const [totals, setTotals] = React.useState<Totals>({ tenants: 0, users: 0, credits: 0 });
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/overview").then((r) => r.json()).then((j) => {
      setTenants(j.tenants ?? []); setSupply(j.supply ?? { listed: 0, available: 0, purchases: 0, value: 0 });
      setTotals(j.totals ?? { tenants: 0, users: 0, credits: 0 }); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function grant(t: Tenant) {
    const raw = window.prompt(`Adjust credits for ${t.name} (current ${t.credits}).\nEnter a positive number to grant, negative to deduct:`, "100");
    if (raw == null) return;
    const delta = Number(raw.replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(delta) || delta === 0) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId: t.id, delta }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) load(); else window.alert(j.error || "Could not adjust credits");
    } finally { setBusy(false); }
  }

  const cols: Column<Tenant>[] = [
    { key: "name", header: "Tenant", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
    { key: "users", header: "Users", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.users}</span>, sort: (r) => r.users },
    { key: "contacts", header: "Contacts", width: 100, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.contacts}</span>, sort: (r) => r.contacts },
    { key: "credits", header: "Credits", width: 130, align: "right", render: (r) => <span style={{ fontWeight: 700, color: r.credits > 0 ? color.status.positive : color.ink.soft, fontVariantNumeric: "tabular-nums" }}>{r.credits.toLocaleString()}</span>, sort: (r) => r.credits },
    { key: "joined", header: "Joined", width: 120, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{r.joined}</span> },
    { key: "act", header: "", width: 140, render: (r) => <Button onClick={() => grant(r)} disabled={busy}>Adjust credits</Button> },
  ];

  return (
    <AppShell active="admin">
      <PageTitleRow title="Admin Portal" breadcrumb="Xentral · Platform operator" subtitle="Cross-tenant control — tenants, credits & marketplace supply" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Tenants" value={String(totals.tenants)} note="workspaces" noteTone={color.brand.primary} />
        <KPICard label="Users" value={String(totals.users)} note="across tenants" noteTone={color.ink.soft} />
        <KPICard label="Credits in circulation" value={totals.credits.toLocaleString()} note="all tenants" noteTone={color.status.positive} />
        <KPICard label="Leads available" value={String(supply.available)} note={`${supply.listed} listed`} noteTone={supply.available > 0 ? color.status.positive : color.status.critical} />
      </div>

      <div style={{ display: "flex", gap: 18, borderBottom: `1px solid ${color.line.DEFAULT}`, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 500, color: tab === t ? color.brand.primary : color.ink.mid, padding: "8px 0", borderBottom: tab === t ? `2px solid ${color.brand.primary}` : "2px solid transparent" }}>{t}</button>
        ))}
      </div>

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div> : (
        <>
          {tab === "Overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <KPICard label="Marketplace inventory value" value={aed(supply.value)} note="listed leads" noteTone={color.brand.primary} />
              <KPICard label="Leads purchased" value={String(supply.purchases)} note="all-time" noteTone={color.ink.soft} />
              <KPICard label="Avg credits / tenant" value={(totals.tenants ? Math.round(totals.credits / totals.tenants) : 0).toLocaleString()} note="balance" noteTone={color.ink.soft} />
            </div>
          )}

          {tab === "Tenants" && (
            tenants.length === 0 ? <EmptyState title="No tenants yet" hint="Workspaces appear here as they sign up." />
              : <DataTable<Tenant> columns={cols} rows={tenants} getKey={(r) => r.id} searchable searchPlaceholder="Search tenant…" title="Tenants" initialSort={{ key: "credits", dir: "desc" }} />
          )}

          {tab === "Marketplace supply" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
              <KPICard label="Listed" value={String(supply.listed)} note="total leads" noteTone={color.ink.soft} />
              <KPICard label="Available now" value={String(supply.available)} note="buyable" noteTone={color.status.positive} />
              <KPICard label="Purchased" value={String(supply.purchases)} note="all-time" noteTone={color.ink.soft} />
              <KPICard label="Inventory value" value={aed(supply.value)} note="at list price" noteTone={color.brand.primary} />
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
