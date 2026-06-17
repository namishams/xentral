"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, EmptyState, type Column } from "@xentral/ui";

type Purchase = { id: string; pricePaid: number; purchasedAt: string; specialty: string | null; category: string | null; originCountry: string | null; firstName: string | null; lastName: string | null; phone: string | null; email: string | null; linkedIn: string | null; yearsExperience: number | null };

const aed = (n: number) => `AED ${Math.round(n || 0).toLocaleString()}`;
const fmt = (s: string) => { const d = new Date(s); return isNaN(+d) ? "" : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); };
const name = (p: Purchase) => [p.firstName, p.lastName].filter(Boolean).join(" ") || p.specialty || "Lead";

export default function PurchasesPage() {
  const [all, setAll] = React.useState<Purchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    fetch("/api/marketplace/purchases").then((r) => r.json()).then((d) => { setAll(d.purchases ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const rows = all.filter((p) => (name(p) + (p.phone || "") + (p.email || "") + (p.category || "")).toLowerCase().includes(q.toLowerCase()));
  const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const kpis = {
    total: all.length,
    spent: all.reduce((s, p) => s + (p.pricePaid || 0), 0),
    month: all.filter((p) => +new Date(p.purchasedAt) >= monthStart).length,
    avg: all.length ? Math.round(all.reduce((s, p) => s + (p.pricePaid || 0), 0) / all.length) : 0,
  };

  const COLUMNS: Column<Purchase>[] = [
    { key: "lead", header: "Lead", render: (p) => (
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT }}>{name(p)}</span>
        <span style={{ display: "block", fontSize: 11.5, color: color.ink.soft }}>{[p.specialty, p.category].filter(Boolean).join(" · ") || "—"}</span>
      </span>
    ) },
    { key: "phone", header: "Phone", width: 160, render: (p) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{p.phone || "—"}</span> },
    { key: "email", header: "Email", render: (p) => <span style={{ color: color.ink.mid }}>{p.email || "—"}</span> },
    { key: "origin", header: "Origin", width: 120, render: (p) => <span style={{ color: color.ink.mid }}>{p.originCountry || "—"}</span> },
    { key: "price", header: "Paid", width: 100, align: "right", render: (p) => <span style={{ fontWeight: 600 }}>{aed(p.pricePaid)}</span> },
    { key: "date", header: "Purchased", width: 120, align: "right", render: (p) => <span style={{ color: color.ink.soft }}>{fmt(p.purchasedAt)}</span> },
  ];

  return (
    <AppShell active="marketplace">
      <PageTitleRow title="Purchased leads" subtitle={`${all.length} purchases · contacts unlocked`} actions={<Button onClick={() => (window.location.href = "/marketplace")}>← Marketplace</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Purchases" value={String(kpis.total)} note="leads bought" noteTone={color.brand.primary} />
        <KPICard label="Total spent" value={aed(kpis.spent)} note="lifetime" noteTone={color.status.positive} />
        <KPICard label="This month" value={String(kpis.month)} note="bought" noteTone={color.ink.soft} />
        <KPICard label="Avg price" value={aed(kpis.avg)} note="per lead" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <Input placeholder="Search name, phone, email, category…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 320 }} />
      </div>

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No purchased leads yet" hint="Leads you buy on the marketplace appear here with full contact details." action={<Button variant="primary" onClick={() => (window.location.href = "/marketplace")}>Browse marketplace</Button>} />
          : <DataTable columns={COLUMNS} rows={rows} getKey={(p) => p.id} />}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Purchased leads · unlocked contacts · live via DataPort · tenant-scoped</p>
    </AppShell>
  );
}
