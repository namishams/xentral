"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { KPICard, Input, Button, EmptyState } from "@xentral/ui";
import type { ActivityRow } from "@xentral/module-crm";

/* Faithful port of the live app's Universal Timeline: KPI band -> type filter chips ->
 * a vertical activity timeline with type glyphs, summary, author and date. DataPort rows, tokens only. */

type TypeMeta = { label: string; glyph: string; accent: string };
const TYPES: Record<string, TypeMeta> = {
  call: { label: "Call", glyph: "C", accent: "#0064d9" },
  email: { label: "Email", glyph: "E", accent: "#6b3fd4" },
  note: { label: "Note", glyph: "N", accent: "#9a5800" },
  meeting: { label: "Meeting", glyph: "M", accent: "#0e7490" },
  whatsapp: { label: "WhatsApp", glyph: "W", accent: "#188918" },
};
const metaFor = (t: string): TypeMeta => TYPES[t.toLowerCase()] ?? { label: t || "Event", glyph: "•", accent: color.ink.soft };

const fmtDate = (s: string) => { const d = new Date(s); return isNaN(+d) ? s : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); };

function Node({ r, last }: { r: ActivityRow; last: boolean }) {
  const m = metaFor(r.type);
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span aria-hidden="true" style={{ display: "inline-flex", width: 30, height: 30, borderRadius: "50%", background: `color-mix(in srgb, ${m.accent} 14%, ${color.surface.card})`, color: m.accent, fontSize: 12, fontWeight: 700, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m.glyph}</span>
        {!last ? <span style={{ flex: 1, width: 2, background: color.line.DEFAULT, marginTop: 2 }} /> : null}
      </div>
      <div style={{ paddingBottom: last ? 0 : 16, flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: m.accent, background: `color-mix(in srgb, ${m.accent} 10%, ${color.surface.card})`, borderRadius: 6, padding: "2px 8px" }}>{m.label}</span>
          <span style={{ fontSize: 12, color: color.ink.soft }}>{fmtDate(r.when)}</span>
          {r.by ? <span style={{ fontSize: 12, color: color.ink.soft }}>· {r.by}</span> : null}
        </div>
        <div style={{ fontSize: 14, color: color.ink.DEFAULT, marginTop: 3 }}>{r.summary || "—"}</div>
      </div>
    </div>
  );
}

export function ActivitiesTable({ rows: all }: { rows: ActivityRow[] }) {
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState("all");

  const types = React.useMemo(() => Array.from(new Set(all.map((r) => r.type.toLowerCase()).filter(Boolean))), [all]);
  const kpis = React.useMemo(() => ({
    total: all.length,
    calls: all.filter((r) => r.type.toLowerCase() === "call").length,
    emails: all.filter((r) => r.type.toLowerCase() === "email").length,
    meetings: all.filter((r) => r.type.toLowerCase() === "meeting").length,
    whatsapp: all.filter((r) => r.type.toLowerCase() === "whatsapp").length,
    people: new Set(all.map((r) => r.by).filter(Boolean)).size,
  }), [all]);

  const rows = all
    .filter((r) => type === "all" || r.type.toLowerCase() === type)
    .filter((r) => (r.summary + r.by + r.type).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => +new Date(b.when) - +new Date(a.when));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Activities" value={String(kpis.total)} note="logged" noteTone={color.brand.primary} />
        <KPICard label="Calls" value={String(kpis.calls)} note="phone" noteTone={color.ink.soft} />
        <KPICard label="Emails" value={String(kpis.emails)} note="sent" noteTone={color.ink.soft} />
        <KPICard label="Meetings" value={String(kpis.meetings)} note="booked" noteTone={color.ink.soft} />
        <KPICard label="WhatsApp" value={String(kpis.whatsapp)} note="inbound" noteTone={color.status.positive} />
        <KPICard label="Teammates" value={String(kpis.people)} note="contributing" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search activity, author…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {[["all", "All"] as [string, string], ...types.map((t) => [t, metaFor(t).label] as [string, string])].map(([id, lab]) => {
          const on = type === id;
          return (
            <button key={id} onClick={() => setType(id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {lab}{id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{all.filter((r) => r.type.toLowerCase() === id).length}</span> : null}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No activities match your filters" hint="Try a different search or type." action={<Button variant="primary" onClick={() => { setQ(""); setType("all"); }}>Clear filters</Button>} />
      ) : (
        <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "18px 18px 14px", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
          {rows.map((r, i) => <Node key={r.id} r={r} last={i === rows.length - 1} />)}
        </div>
      )}
    </>
  );
}
