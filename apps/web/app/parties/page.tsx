"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, KPICard, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";
import { listCompanies, listContacts } from "@xentral/module-crm";
import { listSuppliers } from "@xentral/module-erp";

type Party = { id: string; name: string; kind: "Company" | "Contact" | "Supplier"; sub: string; owner: string; href: string };

const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function PartiesPage() {
  const [q, setQ] = React.useState("");
  const companies = listCompanies().map((a): Party => ({ id: "c-" + a.id, name: a.name, kind: "Company", sub: `${a.industry} · ${a.city}`, owner: a.owner, href: `/companies/${a.id}` }));
  const contacts = listContacts().map((c): Party => ({ id: "p-" + c.id, name: c.name, kind: "Contact", sub: `${c.title} · ${c.company}`, owner: c.owner, href: `/contacts/${c.id}` }));
  const suppliers = (() => { try { return listSuppliers().map((v: any): Party => ({ id: "v-" + v.id, name: v.name, kind: "Supplier", sub: `${v.category} · ${v.country}`, owner: "—", href: `/suppliers/${v.id}` })); } catch { return [] as Party[]; } })();
  const ALL: Party[] = [...companies, ...contacts, ...suppliers];
  const rows = ALL.filter((p) => (p.name + p.sub).toLowerCase().includes(q.toLowerCase()));

  const KIND_TONE = { Company: "info", Contact: "neutral", Supplier: "warning" } as const;
  const COLUMNS: Column<Party>[] = [
    { key: "name", header: "Party", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><span style={{ width: 26, height: 26, borderRadius: r.kind === "Contact" ? "50%" : 7, background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(r.name)}</span><span><span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.sub}</span></span></span> },
    { key: "kind", header: "Type", width: 120, render: (r) => <StatusBadge tone={KIND_TONE[r.kind]} label={r.kind} /> },
    { key: "owner", header: "Owner", width: 120, render: (r) => <span style={{ color: color.ink.mid }}>{r.owner}</span> },
  ];

  const groups = [
    { id: "Company", title: "Companies", accent: color.status.info },
    { id: "Contact", title: "People", accent: color.brand.primary },
    { id: "Supplier", title: "Suppliers", accent: color.status.critical },
  ];
  const visible = groups.map((g) => ({ g, gr: rows.filter((r) => r.kind === g.id) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="parties">
      <PageTitleRow title="Business Partners" subtitle="Every relationship in one directory — companies, people, suppliers" actions={<Button variant="primary">+ New party</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Total parties" value={String(ALL.length)} note="all relationships" noteTone={color.ink.soft} />
        <KPICard label="Companies" value={String(companies.length)} note="accounts" noteTone={color.ink.soft} />
        <KPICard label="People" value={String(contacts.length)} note="contacts" noteTone={color.ink.soft} />
        <KPICard label="Suppliers" value={String(suppliers.length)} note="vendors" noteTone={color.ink.soft} />
      </div>
      <FilterBar>
        <Input placeholder="Search partners…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
      </FilterBar>
      {visible.length === 0 ? (
        <EmptyState title="No partners match" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visible.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => r.href} />
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Business partners · unified across CRM + suppliers · tokens-only, theme-aware</p>
    </AppShell>
  );
}
