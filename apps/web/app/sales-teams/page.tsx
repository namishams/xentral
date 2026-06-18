"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, Panel, PanelHeader, PanelBody, EmptyState } from "@xentral/ui";

type Team = { id: string; name: string; managerId: string | null; managerName: string | null; memberCount: number };
type User = { id: string; name: string | null; email: string | null; teamId: string | null; salesRole: string | null; managerId: string | null };

const initials = (n: string) => (n || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const ROLES = ["REP", "SENIOR", "LEAD", "MANAGER"];

export default function SalesTeamsPage() {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [addTo, setAddTo] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    fetch("/api/crm/teams").then((r) => r.json()).then((j) => { setTeams(j.teams ?? []); setUsers(j.users ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function call(method: string, body?: Record<string, unknown>, qs = "") {
    setBusy(true);
    try { const r = await fetch("/api/crm/teams" + qs, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); if (r.ok) load(); return r.ok; }
    finally { setBusy(false); }
  }
  const newTeam = async () => { const name = window.prompt("Team name:"); if (name && name.trim()) await call("POST", { name: name.trim() }); };
  const rename = async (t: Team) => { const name = window.prompt("Rename team:", t.name); if (name && name.trim() && name.trim() !== t.name) await call("PATCH", { teamId: t.id, name: name.trim() }); };
  const setManager = (t: Team, managerId: string) => call("PATCH", { teamId: t.id, managerId });
  const assign = (userId: string, teamId: string | null) => call("PATCH", { userId, teamId });
  const setRole = (userId: string, salesRole: string) => call("PATCH", { userId, salesRole });
  const delTeam = async (t: Team) => { if (window.confirm(`Delete team “${t.name}”? Members become unassigned.`)) await call("DELETE", undefined, `?teamId=${t.id}`); };

  const membersOf = (tid: string) => users.filter((u) => u.teamId === tid);
  const unassigned = users.filter((u) => !u.teamId);
  const roleTone = (r: string | null) => r === "MANAGER" ? color.brand.primary : r === "LEAD" ? color.status.positive : color.ink.soft;

  const memberRow = (u: User, t?: Team) => (
    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(u.name || "?")}</span>
      <span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || u.email}{t && t.managerId === u.id ? <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: color.brand.primary }}>· MANAGER</span> : null}</span>{u.email ? <span style={{ display: "block", fontSize: 11, color: color.ink.soft }}>{u.email}</span> : null}</span>
      <select value={u.salesRole || ""} onChange={(e) => setRole(u.id, e.target.value)} disabled={busy} style={{ height: 28, fontSize: 11.5, border: `1px solid ${color.line.strong}`, borderRadius: 7, background: color.surface.card, color: roleTone(u.salesRole), fontWeight: 600, padding: "0 6px" }}>
        <option value="">Role…</option>
        {ROLES.map((r) => <option key={r} value={r}>{r[0] + r.slice(1).toLowerCase()}</option>)}
      </select>
      <button onClick={() => assign(u.id, null)} disabled={busy} title="Remove from team" style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 7, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.soft, cursor: "pointer" }}>×</button>
    </div>
  );

  return (
    <AppShell active="sales-teams">
      <PageTitleRow title="Sales Teams" subtitle={`${teams.length} team${teams.length === 1 ? "" : "s"} · ${users.length - unassigned.length}/${users.length} assigned`}
        actions={<Button variant="primary" onClick={newTeam} disabled={busy}>+ New team</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Teams" value={String(teams.length)} note="active" noteTone={color.ink.soft} />
        <KPICard label="Reps" value={String(users.length)} note="in workspace" noteTone={color.brand.primary} />
        <KPICard label="Assigned" value={String(users.length - unassigned.length)} note="on a team" noteTone={color.status.positive} />
        <KPICard label="Unassigned" value={String(unassigned.length)} note={unassigned.length ? "need a team" : "all placed"} noteTone={unassigned.length ? color.status.critical : color.ink.soft} />
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {teams.length === 0 ? <EmptyState title="No sales teams yet" hint="Create your first team, then assign a manager and reps." action={<Button variant="primary" onClick={newTeam}>+ New team</Button>} />
              : teams.map((t) => {
                const mem = membersOf(t.id);
                return (
                  <Panel key={t.id}>
                    <PanelHeader title={t.name} subtitle={`${mem.length} member${mem.length === 1 ? "" : "s"}`} actions={
                      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        <select value={t.managerId || ""} onChange={(e) => setManager(t, e.target.value)} disabled={busy} title="Team manager" style={{ height: 30, fontSize: 12, border: `1px solid ${color.line.strong}`, borderRadius: 8, background: color.surface.card, color: color.ink.DEFAULT, padding: "0 8px" }}>
                          <option value="">Manager…</option>
                          {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                        </select>
                        <Button onClick={() => rename(t)} disabled={busy}>Rename</Button>
                        <button onClick={() => delTeam(t)} disabled={busy} title="Delete team" style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.status.negative, cursor: "pointer" }}>🗑</button>
                      </span>} />
                    <PanelBody flush>
                      {mem.length === 0 ? <div style={{ padding: 14, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No members yet.</div> : mem.map((u) => memberRow(u, t))}
                      {addTo === t.id ? (
                        <div style={{ padding: "10px 14px", background: color.surface.page, display: "flex", gap: 8, alignItems: "center" }}>
                          <select autoFocus onChange={(e) => { if (e.target.value) { assign(e.target.value, t.id); setAddTo(null); } }} style={{ flex: 1, height: 32, fontSize: 12.5, border: `1px solid ${color.line.strong}`, borderRadius: 8, background: color.surface.card, color: color.ink.DEFAULT, padding: "0 8px" }}>
                            <option value="">Select a rep to add…</option>
                            {users.filter((u) => u.teamId !== t.id).map((u) => <option key={u.id} value={u.id}>{u.name || u.email}{u.teamId ? " (move)" : ""}</option>)}
                          </select>
                          <Button onClick={() => setAddTo(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div style={{ padding: "9px 14px" }}><Button onClick={() => setAddTo(t.id)} disabled={busy}>+ Add member</Button></div>
                      )}
                    </PanelBody>
                  </Panel>
                );
              })}
          </div>

          <Panel>
            <PanelHeader title="Unassigned" subtitle={`${unassigned.length} rep${unassigned.length === 1 ? "" : "s"}`} />
            <PanelBody flush>
              {unassigned.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>Everyone is on a team. 🎉</div>
                : unassigned.map((u) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                    <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: "50%", background: color.surface.sunken, color: color.ink.mid, fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(u.name || "?")}</span>
                    <span style={{ minWidth: 0, flex: 1, fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || u.email}</span>
                    {teams.length > 0 ? (
                      <select onChange={(e) => { if (e.target.value) assign(u.id, e.target.value); }} disabled={busy} style={{ height: 28, fontSize: 11.5, border: `1px solid ${color.line.strong}`, borderRadius: 7, background: color.surface.card, color: color.brand.primary, fontWeight: 600, padding: "0 6px" }}>
                        <option value="">Assign…</option>
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    ) : null}
                  </div>
                ))}
            </PanelBody>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
