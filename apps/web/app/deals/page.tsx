"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, KPICard, Input, Button, DataTable, StagePill, EmptyState, Modal, type Column } from "@xentral/ui";
import { listDeals, type DealRow, type DealStage } from "@xentral/module-crm";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${n}`;
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const LS_KEY = "xentral-deals-extra";
const STAGES: DealStage[] = ["new", "qualified", "proposal", "won", "lost"];

function loadExtra(): DealRow[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveExtra(rows: DealRow[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(rows)); } catch {}
}

function Avatar({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center" }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<DealRow>[] = [
  { key: "name", header: "Deal", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "owner", header: "Owner", width: 80, render: (r) => <Avatar name={r.owner} /> },
  { key: "account", header: "Contact", render: (r) => <span style={{ color: color.ink.mid }}>{r.account}</span> },
  { key: "stage", header: "Stage", width: 140, render: (r) => <StagePill stage={r.stage} /> },
  { key: "value", header: "Value", width: 130, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.value)}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: string) => boolean }[] = [
  { id: "active", title: "Active deals", accent: color.status.info, match: (s) => s === "new" || s === "qualified" || s === "proposal" || s === "negotiation" },
  { id: "won", title: "Won", accent: color.status.positive, match: (s) => s === "won" },
  { id: "lost", title: "Lost", accent: color.status.negative, match: (s) => s === "lost" },
];

const TABS: [string, string][] = [["main", "Main view"], ["kanban", "Kanban"], ["forecast", "Forecast"]];

export default function DealsPage() {
  const [q, setQ] = React.useState("");
  const [view, setView] = React.useState("main");
  const [extra, setExtra] = React.useState<DealRow[]>([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", account: "", value: "", stage: "new" as DealStage });

  React.useEffect(() => { setExtra(loadExtra()); }, []);

  const ALL = React.useMemo(() => [...extra, ...listDeals()], [extra]);
  const rows = ALL.filter((r) => (r.name + r.account + r.owner).toLowerCase().includes(q.toLowerCase()));
  const openValue = ALL.filter((r) => r.stage !== "won" && r.stage !== "lost").reduce((s, r) => s + r.value, 0);
  const wonValue = ALL.filter((r) => r.stage === "won").reduce((s, r) => s + r.value, 0);
  const wonCount = ALL.filter((r) => r.stage === "won").length;
  const lostCount = ALL.filter((r) => r.stage === "lost").length;
  const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;
  const openCount = ALL.filter((r) => r.stage !== "won" && r.stage !== "lost").length;
  const avgDeal = ALL.length ? Math.round(ALL.reduce((s, r) => s + r.value, 0) / ALL.length) : 0;
  const largestOpen = ALL.filter((r) => r.stage !== "won" && r.stage !== "lost").reduce((m, r) => Math.max(m, r.value), 0);
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.stage)) })).filter((x) => x.gr.length > 0);

  const submit = () => {
    if (!form.name.trim()) return;
    const deal: DealRow = { id: "u" + Date.now(), name: form.name.trim(), account: form.account.trim() || "—", stage: form.stage, value: Number(form.value) || 0, currency: "AED", owner: "Nami" };
    const next = [deal, ...extra];
    setExtra(next); saveExtra(next);
    setForm({ name: "", account: "", value: "", stage: "new" }); setOpen(false);
  };

  return (
    <AppShell active="deals">
      <PageTitleRow title="Deals" subtitle={`${ALL.length} deals · ${aed(openValue)} open pipeline`} actions={<Button variant="primary" onClick={() => setOpen(true)}>+ New deal</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Open pipeline" value={aedShort(openValue)} note={`${openCount} active deals`} noteTone={color.brand.primary} />
        <KPICard label="Won" value={aedShort(wonValue)} note={`${wonCount} closed won`} noteTone={color.status.positive} />
        <KPICard label="Win rate" value={`${winRate}%`} note="won vs lost" noteTone={winRate >= 50 ? color.status.positive : color.status.critical} />
        <KPICard label="Avg deal" value={aedShort(avgDeal)} note="all deals" noteTone={color.ink.soft} />
        <KPICard label="Largest open" value={aedShort(largestOpen)} note="top opportunity" noteTone={color.ink.soft} />
        <KPICard label="Deals" value={String(ALL.length)} note="total tracked" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 20, borderBottom: `1px solid ${color.line.DEFAULT}`, marginBottom: 16 }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: view === id ? 600 : 500, color: view === id ? color.brand.primary : color.ink.mid, padding: "8px 0", borderBottom: view === id ? `2px solid ${color.brand.primary}` : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      <FilterBar>
        <Input placeholder="Search deals…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <Button>Stage</Button>
        <Button>Owner</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No deals match your search" hint="Try a different name, contact or owner." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
                <span style={{ fontSize: 12, color: color.ink.soft, marginLeft: "auto" }}>{aed(gr.reduce((s, r) => s + r.value, 0))}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/deals/${r.id}`} />
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New deal" footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Create deal</Button></>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "block" }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 5 }}>Deal name</span><Input autoFocus placeholder="e.g. Office relocation" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%" }} /></label>
          <label style={{ display: "block" }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 5 }}>Contact / account</span><Input placeholder="e.g. Gulf Trading" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} style={{ width: "100%" }} /></label>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ flex: 1 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 5 }}>Value (AED)</span><Input type="number" placeholder="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} style={{ width: "100%" }} /></label>
            <label style={{ flex: 1 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 5 }}>Stage</span>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as DealStage })} style={{ width: "100%", height: 40, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, padding: "0 10px" }}>
                {STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </label>
          </div>
        </div>
      </Modal>

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Interactive · creates deals that persist in your browser (survives reload) · locked DataTable + Modal · tokens-only</p>
    </AppShell>
  );
}
