"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { KPICard, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column } from "@xentral/ui";
import type { ContactRow } from "@xentral/module-crm";

/* Faithful port of the live app's Contacts command-center layout:
 *   KPI band -> search + owner chips + sort + list/grid toggle -> rich avatar table / card grid.
 * Driven entirely by the DataPort rows (seed on preview, live behind auth). Tokens-only, theme-aware. */

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const ACCENTS = ["#0064d9", "#188918", "#9a5800", "#0e7490", "#6b3fd4", "#b3261e"];
const accentFor = (s: string) => ACCENTS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length];

function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const a = accentFor(name);
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", width: size, height: size, borderRadius: "50%", background: `color-mix(in srgb, ${a} 14%, ${color.surface.card})`, color: a, fontSize: size * 0.4, fontWeight: 700, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(name)}</span>
  );
}

const SORTS: { k: string; label: string }[] = [
  { k: "name", label: "Name A-Z" },
  { k: "company", label: "Company A-Z" },
  { k: "owner", label: "Owner" },
];

const COLUMNS: Column<ContactRow>[] = [
  { key: "name", header: "Contact", render: (r) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Avatar name={r.name} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT, lineHeight: "16px" }}>{r.name}</span>
        <span style={{ display: "block", fontSize: 12, color: color.ink.soft, lineHeight: "15px" }}>{r.title || "-"}</span>
      </span>
    </span>
  ) },
  { key: "company", header: "Company", render: (r) => <span style={{ color: color.ink.mid }}>{r.company || "-"}</span> },
  { key: "owner", header: "Owner", width: 120, render: (r) => (r.owner ? <StatusBadge tone="info" label={r.owner} /> : <span style={{ color: color.ink.soft }}>Unassigned</span>) },
  { key: "email", header: "Email", render: (r) => <span style={{ color: color.ink.mid }}>{r.email || "-"}</span> },
  { key: "phone", header: "Phone", width: 170, render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.phone || "-"}</span> },
];

function Card({ r }: { r: ContactRow }) {
  return (
    <a href={`/contacts/${r.id}`} style={{ textDecoration: "none", background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <Avatar name={r.name} size={40} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: 14, color: color.ink.DEFAULT }}>{r.name}</span>
          <span style={{ display: "block", fontSize: 12, color: color.ink.soft }}>{r.title || "-"}</span>
        </span>
      </div>
      <div style={{ height: 1, background: color.line.DEFAULT }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, color: color.ink.mid }}>
        <span>{r.company || "-"}</span>
        <span>{r.email || "-"}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{r.phone || "-"}</span>
      </div>
      <div style={{ marginTop: 2 }}>{r.owner ? <StatusBadge tone="info" label={r.owner} /> : <span style={{ fontSize: 12, color: color.ink.soft }}>Unassigned</span>}</div>
    </a>
  );
}

export function ContactsTable({ rows: all }: { rows: ContactRow[] }) {
  const [q, setQ] = React.useState("");
  const [owner, setOwner] = React.useState("all");
  const [sortK, setSortK] = React.useState("name");
  const [view, setView] = React.useState<"list" | "grid">("list");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);

  React.useEffect(() => { const v = typeof window !== "undefined" ? localStorage.getItem("xentral.contacts.view") : null; if (v === "grid" || v === "list") setView(v); }, []);
  const setViewP = (v: "list" | "grid") => { setView(v); try { localStorage.setItem("xentral.contacts.view", v); } catch {} };

  const owners = React.useMemo(() => Array.from(new Set(all.map((r) => r.owner).filter(Boolean))) as string[], [all]);
  const kpis = React.useMemo(() => ({
    total: all.length,
    withCompany: all.filter((r) => r.company).length,
    companies: new Set(all.map((r) => r.company).filter(Boolean)).size,
    owners: owners.length,
    withEmail: all.filter((r) => r.email).length,
    withPhone: all.filter((r) => r.phone).length,
  }), [all, owners]);

  const filtered = all
    .filter((r) => owner === "all" || r.owner === owner)
    .filter((r) => (r.name + r.company + r.email + r.title).toLowerCase().includes(q.toLowerCase()));
  const rows = [...filtered].sort((a, b) =>
    sortK === "company" ? (a.company || "").localeCompare(b.company || "")
      : sortK === "owner" ? (a.owner || "").localeCompare(b.owner || "")
        : a.name.localeCompare(b.name));

  const pageRows = view === "list" ? rows.slice((page - 1) * pageSize, page * pageSize) : rows;
  const selStyle: React.CSSProperties = { height: 34, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, padding: "0 10px", cursor: "pointer" };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Contacts" value={String(kpis.total)} note="in directory" noteTone={color.brand.primary} />
        <KPICard label="With company" value={String(kpis.withCompany)} note="linked to an account" noteTone={color.ink.soft} />
        <KPICard label="Companies" value={String(kpis.companies)} note="distinct accounts" noteTone={color.ink.soft} />
        <KPICard label="Owners" value={String(kpis.owners)} note="team coverage" noteTone={color.status.positive} />
        <KPICard label="With email" value={String(kpis.withEmail)} note="reachable" noteTone={color.ink.soft} />
        <KPICard label="With phone" value={String(kpis.withPhone)} note="callable" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search name, title, company, email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 300 }} />
        <select value={sortK} onChange={(e) => setSortK(e.target.value)} style={selStyle}>
          {SORTS.map((s) => <option key={s.k} value={s.k}>Sort: {s.label}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <span style={{ display: "inline-flex", border: `1px solid ${color.line.strong}`, borderRadius: 8, overflow: "hidden", background: color.surface.card }}>
          {(["list", "grid"] as const).map((v) => (
            <button key={v} onClick={() => setViewP(v)} title={v === "list" ? "List" : "Cards"} style={{ border: 0, width: 38, height: 32, cursor: "pointer", background: view === v ? color.brand.primary : "transparent", color: view === v ? color.ink.onPrimary : color.ink.soft, fontSize: 14 }}>{v === "list" ? "☰" : "▦"}</button>
          ))}
        </span>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
        {[["all", "All"] as [string, string], ...owners.map((o) => [o, o] as [string, string])].map(([id, lab]) => {
          const on = owner === id;
          return (
            <button key={id} onClick={() => { setOwner(id); setPage(1); }} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {lab}{id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{all.filter((r) => r.owner === id).length}</span> : null}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No contacts match your filters" hint="Try a different search or owner." action={<Button variant="primary" onClick={() => { setQ(""); setOwner("all"); }}>Clear filters</Button>} />
      ) : view === "list" ? (
        <>
          <DataTable columns={COLUMNS} rows={pageRows} getKey={(r) => r.id} rowHref={(r) => `/contacts/${r.id}`} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {rows.map((r) => <Card key={r.id} r={r} />)}
        </div>
      )}
    </>
  );
}
