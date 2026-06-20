"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { Panel, PanelHeader, PanelBody, Button } from "@xentral/ui";

type Note = { id: string; subject?: string | null; content?: string; type: string; at: string; who?: string | null };
type LC = { key: string; label: string; at: string; who?: string | null; type: string };
type Wa = { id: string; contactPhone: string; lastMessageAt: string; lastMessageBody: string | null };
type Data = { lifecycle: LC[]; notes: Note[]; comms: { whatsapp: Wa[]; activities: Note[] }; contactId: string | null };

const GLYPH: Record<string, string> = { NOTE: "📝", EMAIL: "✉️", CALL: "☎️", MEETING: "👥", STATUS_CHANGE: "⇄", BILLING: "🧾" };

export function DocTimeline({ docType, docId }: { docType: "QUOTE" | "INVOICE"; docId: string }) {
  const [d, setD] = React.useState<Data | null>(null);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    fetch(`/api/books/activity?docType=${docType}&docId=${docId}`).then((r) => r.json()).then((j) => setD(j.error ? { lifecycle: [], notes: [], comms: { whatsapp: [], activities: [] }, contactId: null } : j)).catch(() => {});
  }, [docType, docId]);
  React.useEffect(() => { load(); }, [load]);

  async function addNote() {
    const t = draft.trim(); if (!t) return; setBusy(true);
    try { const r = await fetch("/api/books/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ docType, docId, content: t }) }); if (r.ok) { setDraft(""); load(); } }
    finally { setBusy(false); }
  }

  const feed: { id: string; label: string; content?: string; type: string; at: string; who?: string | null }[] = d ? [
    ...d.notes.map((n) => ({ id: n.id, label: n.subject || "Note", content: n.content, type: n.type, at: n.at, who: n.who })),
    ...d.lifecycle.map((l) => ({ id: l.key, label: l.label, type: l.type, at: l.at, who: l.who })),
  ] : [];
  const hasComms = !!d && (d.comms.whatsapp.length > 0 || d.comms.activities.length > 0);

  return (
    <>
      <Panel>
        <PanelHeader title="Activity & notes" subtitle={feed.length ? `${feed.length} events` : undefined} />
        <PanelBody>
          <div style={{ display: "flex", gap: 8, marginBottom: feed.length ? 14 : 0 }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }} placeholder="Add an internal note…"
              style={{ flex: 1, height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" }} />
            <Button variant="primary" onClick={addNote} disabled={busy || !draft.trim()}>{busy ? "…" : "Add"}</Button>
          </div>
          {feed.length === 0 ? <div style={{ fontSize: 13, color: color.ink.soft, paddingTop: 4 }}>No activity yet. Notes and lifecycle events appear here.</div> : (
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 2, background: color.line.DEFAULT }} />
              {feed.map((f, i) => (
                <div key={f.id + i} style={{ position: "relative", paddingBottom: 14 }}>
                  <span style={{ position: "absolute", left: -22, top: 0, width: 16, height: 16, borderRadius: "50%", background: color.surface.card, border: `2px solid ${color.line.strong}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>{GLYPH[f.type] || "•"}</span>
                  <div style={{ fontSize: 13, color: color.ink.DEFAULT, fontWeight: f.content ? 400 : 500 }}>{f.content || f.label}</div>
                  <div style={{ fontSize: 11, color: color.ink.soft, marginTop: 1 }}>{f.content ? `${f.label} · ` : ""}{f.at}{f.who ? ` · ${f.who}` : ""}</div>
                </div>
              ))}
            </div>
          )}
        </PanelBody>
      </Panel>

      {hasComms ? (
        <Panel>
          <PanelHeader title="Customer communication" actions={d?.contactId ? <a href={`/contacts/${d.contactId}`} style={{ fontSize: 12, color: color.brand.primary, textDecoration: "none" }}>Open contact</a> : undefined} />
          <PanelBody flush>
            {d!.comms.whatsapp.map((w) => (
              <div key={w.id} style={{ display: "flex", gap: 10, padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                <span style={{ flexShrink: 0 }}>💬</span>
                <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT }}>{w.contactPhone} <span style={{ color: color.ink.soft, fontWeight: 400 }}>· {w.lastMessageAt}</span></div>{w.lastMessageBody ? <div style={{ fontSize: 12, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.lastMessageBody}</div> : null}</div>
              </div>
            ))}
            {d!.comms.activities.map((a) => (
              <div key={a.id} style={{ display: "flex", gap: 10, padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                <span style={{ flexShrink: 0 }}>{GLYPH[a.type] || "•"}</span>
                <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT }}>{a.subject || a.type}</div><div style={{ fontSize: 11, color: color.ink.soft }}>{a.at}</div></div>
              </div>
            ))}
          </PanelBody>
        </Panel>
      ) : null}
    </>
  );
}
