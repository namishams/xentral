"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listApiKeys, type ApiKeyRow, type ApiKeyStatus } from "@xentral/module-platform";

const ALL = listApiKeys();
const TONE: Record<ApiKeyStatus, BadgeTone> = { active: "positive", revoked: "neutral" };

const COLUMNS: Column<ApiKeyRow>[] = [
  { key: "name", header: "Name", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "prefix", header: "Key", width: 160, render: (r) => <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, color: color.ink.mid }}>{r.prefix}</span> },
  { key: "created", header: "Created", width: 100, render: (r) => <span style={{ color: color.ink.mid }}>{r.created}</span> },
  { key: "lastUsed", header: "Last used", width: 110, render: (r) => <span style={{ color: color.ink.mid }}>{r.lastUsed}</span> },
  { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: ApiKeyStatus) => boolean }[] = [
  { id: "active", title: "Active", accent: color.status.positive, match: (s) => s === "active" },
  { id: "revoked", title: "Revoked", accent: color.ink.soft, match: (s) => s === "revoked" },
];

export default function ApiKeysPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.name + r.prefix).toLowerCase().includes(q.toLowerCase()));
  const active = ALL.filter((r) => r.status === "active").length;
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="api-keys">
      <PageTitleRow title="API Keys" subtitle={`${active} active keys`} actions={<Button variant="primary">+ Create key</Button>} />
      <FilterBar>
        <Input placeholder="Search keys…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No API keys" hint="Create your first key to use the Xentral API." action={<Button variant="primary">+ Create key</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Developer access · @xentral/module-platform · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
