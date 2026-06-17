"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

type Ref = { id: string; company: string; plan: string; status: "trial" | "active" | "churned"; commission: number };
const REFS: Ref[] = [
  { id: "r1", company: "Coastal Logistics", plan: "Growth", status: "active", commission: 200 },
  { id: "r2", company: "Vertex Clinics", plan: "Growth", status: "active", commission: 200 },
  { id: "r3", company: "Nair Consulting", plan: "Starter", status: "trial", commission: 0 },
  { id: "r4", company: "Becker GmbH", plan: "Growth", status: "churned", commission: 0 },
];
const TONE: Record<Ref["status"], BadgeTone> = { active: "positive", trial: "info", churned: "neutral" };

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLS: Column<Ref>[] = [
  { key: "company", header: "Referred company", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.company} /><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.company}</span></span> },
  { key: "plan", header: "Plan", width: 110, render: (r) => <StatusBadge tone="info" label={r.plan} /> },
  { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  { key: "commission", header: "Monthly commission", width: 180, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.commission)}</span> },
];

const FILTERS: [Ref["status"] | "all", string][] = [["all", "All"], ["active", "Active"], ["trial", "Trial"], ["churned", "Churned"]];

export default function ResellerPage() {
  const [q, setQ] = React.useState("");
  const [filt, setFilt] = React.useState<Ref["status"] | "all">("all");
  const rows = REFS.filter((r) => filt === "all" || r.status === filt).filter((r) => (r.company + r.plan).toLowerCase().includes(q.toLowerCase()));
  const monthly = REFS.reduce((s, r) => s + r.commission, 0);
  const active = REFS.filter((r) => r.status === "active").length;
  const trial = REFS.filter((r) => r.status === "trial").length;
  const churned = REFS.filter((r) => r.status === "churned").length;
  const conversion = REFS.length ? Math.round((active / REFS.length) * 100) : 0;

  return (
    <AppShell active="reseller">
      <PageTitleRow title="Reseller" subtitle="Refer customers, earn recurring commission" actions={<Button variant="primary">Copy referral link</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Monthly commission" value={aed(monthly)} note="recurring" noteTone={color.status.positive} />
        <KPICard label="Active referrals" value={String(active)} note={`of ${REFS.length}`} noteTone={color.brand.primary} />
        <KPICard label="In trial" value={String(trial)} note="converting" noteTone={color.status.info} />
        <KPICard label="Conversion" value={`${conversion}%`} note="trial → active" noteTone={conversion >= 50 ? color.status.positive : color.status.critical} />
        <KPICard label="Tier" value="Gold" note="25% lifetime" noteTone={color.ink.soft} />
        <KPICard label="Lifetime earned" value={aed(4800)} note="since Jan 2026" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search referred company…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map(([id, lab]) => {
          const on = filt === id;
          return (
            <button key={id} onClick={() => setFilt(id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {lab}{id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{REFS.filter((r) => r.status === id).length}</span> : null}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No referrals match your filters" hint="Try a different search or status." action={<Button variant="primary" onClick={() => { setQ(""); setFilt("all"); }}>Clear filters</Button>} />
      ) : (
        <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} />
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Reseller portal · recurring commission · locked DataTable + StatusBadge · tokens-only</p>
    </AppShell>
  );
}
