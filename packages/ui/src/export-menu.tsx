"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";

const CLOUDS = [
  { id: "google-drive", label: "Save to Google Drive" },
  { id: "dropbox", label: "Save to Dropbox" },
  { id: "onedrive", label: "Save to OneDrive" },
];

/** ExportMenu — reusable 36px Export button + dropdown.
 * Downloads a tenant-scoped CSV from /api/export/<entity>; cloud targets route
 * to Settings → Integrations to connect (Drive / Dropbox / OneDrive). */
export function ExportMenu({ entity, label = "Export" }: { entity: string; label?: string }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (!open) return; const h = () => setOpen(false); document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, [open]);
  const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", fontSize: 13, color: color.ink.DEFAULT, textDecoration: "none", borderRadius: 7, whiteSpace: "nowrap", cursor: "pointer" };
  const cap: React.CSSProperties = { padding: "6px 11px 4px", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" };
  return (
    <span style={{ position: "relative", display: "inline-flex" }} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Export" aria-expanded={open}
        style={{ height: uiConstants.control.height, padding: "0 12px", borderRadius: uiConstants.control.radius, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
        <svg width={uiConstants.icon.md} height={uiConstants.icon.md} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></svg>
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: 42, minWidth: 214, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, boxShadow: "0 12px 32px -8px rgba(20,28,38,0.25)", zIndex: 60, padding: 6 }}>
          <div style={cap}>Download</div>
          <a href={`/api/export/${entity}?format=csv`} style={item}>CSV (Excel-compatible)</a>
          <div style={{ height: 1, background: color.line.DEFAULT, margin: "5px 6px" }} />
          <div style={cap}>Send to cloud</div>
          {CLOUDS.map((c) => <a key={c.id} href={`/settings/integrations?connect=${c.id}&export=${entity}`} style={item}>{c.label}</a>)}
        </div>
      )}
    </span>
  );
}
