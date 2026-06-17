"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { FilterBar, Input, StatusBadge, EmptyState, type BadgeTone } from "@xentral/ui";
import type { TimelineEvent } from "@xentral/module-crm";

function kindTone(kind: string): BadgeTone {
  return kind === "task" ? "warning" : "info";
}

export function TimelineFeed({ events }: { events: TimelineEvent[] }) {
  const [q, setQ] = React.useState("");
  const rows = events.filter((e) => (e.title + e.who + e.detail).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <FilterBar>
        <Input placeholder="Search the timeline…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="Nothing on the timeline" hint="Activities and tasks will appear here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, overflow: "hidden" }}>
          {rows.map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${color.line.DEFAULT}` }}>
              <span style={{ width: 86, flexShrink: 0, fontSize: 12, color: color.ink.soft }}>{e.when}</span>
              <StatusBadge tone={kindTone(e.kind)} label={e.kind} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: color.ink.DEFAULT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
              <span style={{ fontSize: 11.5, color: color.ink.soft }}>{e.detail}</span>
              {e.who ? <StatusBadge tone="neutral" label={e.who} /> : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
