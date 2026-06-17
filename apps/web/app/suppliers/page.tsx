"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";
import { listSuppliers, type SupplierRow } from "@xentral/module-erp";

const ALL = listSuppliers();
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const ACCENTS = ["#0064d9", "#188918", "#9a5800", "#0e7490", "#6b3fd4", "#b3261e"];
const accentFor = (s: string) => ACCENTS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length];
function Logo({ name }: { name: string }) {
  const a = accentFor(name);
  return <span aria-hidden="true" style={{ display: "inline-flex", width: 30, height: 30, borderRadius: 8, background: `color-mix(in srgb, ${a} 14%, ${color.surface.card})`, color: a, fontSize: 11, fontWeight: 700, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(name)}</span>;
}

const COLUMNS: Column<SupplierRow>[] = [
  { key: "name", header: "Supplier", render: (r) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Logo name={r.name} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT, lineHeight: "16px" }}>{r.name}</span>
        <span style={{ display: "block", fontSize: 11.5, color: color.ink.soft, lineHeight: "15px" }}>{r.category}</span>
      </span>
    </span>
  ) },
  { key: "country", header: "Country", width: 150, render: (r) => <span style={{ color: color.ink.mid }}>{r.country}</span> },
  { key: "openOrders", header: "Open orders", width: 130, render: (r) => <StatusBadge tone={r.openOrders > 0 ? "info" : "neutral"} label={String(r.openOrders)} /> },
];

export default function SuppliersPage() {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const categories = React.useMemo(() => Array.from(new Set(ALL.map((r) => r.category))), []);
  const rows = ALL.filter((r) => cat === "all" || r.category === cat).filter((r) => (r.name + r.category + r.country).toLowerCase().includes(q.toLowerCase()));
  const openOrders = ALL.reduce((s, r) => s + r.openOrders, 0);
  const active = ALL.filter((r) => r.openOrders > 0).length;
  const countries = new Set(ALL.map((r) => r.country)).size;

  return (
    <AppShell active="suppliers">
      <PageTitleRow title="Suppliers" subtitle={`${ALL.length} vendors · ${openOrders} open orders`} actions={<Button variant="primary">+ New supplier</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Suppliers" value={String(ALL.length)} note="vendors" noteTone={color.brand.primary} />
        <KPICard label="Open orders" value={String(openOrders)} note="in progress" noteTone={color.status.info} />
        <KPICard label="Active" value={String(active)} note="with open POs" noteTone={color.status.positive} />
        <KPICard label="Categories" value={String(categories.length)} note="supply types" noteTone={color.ink.soft} />
        <KPICard label="Countries" value={String(countries)} note="sourcing" noteTone={color.ink.soft} />
        <KPICard label="Idle" value={String(ALL.length - active)} note="no open PO" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search supplier, category, country…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {[["all", "All"] as [string, string], ...categories.map((c) => [c, c] as [string, string])].map(([id, lab]) => {
          const on = cat === id;
          return (
            <button key={id} onClick={() => setCat(id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {lab}{id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{ALL.filter((r) => r.category === id).length}</span> : null}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No suppliers match your filters" hint="Try a different search or category." action={<Button variant="primary" onClick={() => { setQ(""); setCat("all"); }}>Clear filters</Button>} />
      ) : (
        <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/suppliers/${r.id}`} />
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Command center · locked DataTable + StatusBadge · tokens-only, theme-aware</p>
    </AppShell>
  );
}
