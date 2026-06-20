"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";

type Field = { label: string; req?: boolean };
const FIELDS: Record<string, Field[]> = {
  items: [{ label: "Name", req: true }, { label: "Unit Price", req: true }, { label: "VAT %" }, { label: "Category" }, { label: "SKU" }, { label: "Type" }, { label: "Description" }],
  customers: [{ label: "Name", req: true }, { label: "Email" }],
  contacts: [{ label: "First name", req: true }, { label: "Last name" }, { label: "Email" }, { label: "Phone" }, { label: "Title" }],
};

function parseCsv(text: string): string[][] {
  const out: string[][] = []; let i = 0, field = "", row: string[] = [], q = false;
  while (i < text.length) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } q = false; i++; continue; } field += c; i++; continue; }
    if (c === '"') { q = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); out.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field !== "" || row.length) { row.push(field); out.push(row); }
  return out.filter((r) => r.some((x) => x.trim() !== ""));
}

export function ImportButton({ entity, label = "Import" }: { entity: string; label?: string }) {
  const fields = FIELDS[entity] ?? [];
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  function ingest(text: string) {
    const grid = parseCsv(text);
    if (grid.length < 2) { setRows([]); setMsg("Need a header row plus at least one data row."); return; }
    const headers = (grid[0] ?? []).map((h) => h.trim().toLowerCase());
    const data = grid.slice(1).map((r) => { const o: Record<string, string> = {}; headers.forEach((h, idx) => { o[h] = (r[idx] ?? "").trim(); }); return o; });
    setMsg(""); setRows(data);
  }
  const req = fields.filter((f) => f.req).map((f) => f.label.toLowerCase());
  const valid = rows.filter((r) => req.every((k) => (r[k] ?? "") !== ""));

  async function run() {
    if (valid.length === 0) { setMsg("No valid rows (check required columns)."); return; }
    setBusy(true); setMsg("");
    const res = await fetch(`/api/import/${entity}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: valid }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(d.error || "Import failed"); return; }
    setMsg(`Imported ${d.created}. Reloading…`); setTimeout(() => window.location.reload(), 700);
  }

  const template = "data:text/csv;charset=utf-8," + encodeURIComponent(fields.map((f) => f.label).join(",") + "\n");
  const item: React.CSSProperties = { fontSize: 13, color: color.ink.DEFAULT };

  return (
    <>
      <button onClick={() => { setOpen(true); setRows([]); setMsg(""); }} aria-label="Import"
        style={{ height: uiConstants.control.height, padding: "0 12px", borderRadius: uiConstants.control.radius, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
        <svg width={uiConstants.icon.md} height={uiConstants.icon.md} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 9 5-5 5 5" /><path d="M12 4v12" /></svg>
        {label}
      </button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,32,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "100%", maxHeight: "86vh", overflowY: "auto", background: color.surface.card, borderRadius: 14, border: `1px solid ${color.line.DEFAULT}`, boxShadow: "0 24px 60px -12px rgba(15,23,32,0.4)", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>Import {entity}</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: 13, color: color.ink.mid, margin: "0 0 12px" }}>
              Upload or paste a CSV. Columns: {fields.map((f) => f.label + (f.req ? "*" : "")).join(", ")}. <a href={template} download={`${entity}-template.csv`} style={{ color: color.brand.primary, fontWeight: 600, textDecoration: "none" }}>Download template</a>
            </p>
            <input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) f.text().then(ingest); }}
              style={{ display: "block", marginBottom: 10, fontSize: 13 }} />
            <textarea placeholder="…or paste CSV rows here" onChange={(e) => ingest(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", minHeight: 96, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: 10, fontSize: 13, fontFamily: "ui-monospace, monospace", color: color.ink.DEFAULT, background: color.surface.page, outline: "none", marginBottom: 10 }} />
            {rows.length > 0 && (
              <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ padding: "7px 11px", background: color.surface.sunken, fontSize: 12, fontWeight: 600, color: color.ink.mid }}>{valid.length} of {rows.length} rows ready</div>
                <div style={{ maxHeight: 150, overflowY: "auto" }}>
                  {rows.slice(0, 6).map((r, i) => <div key={i} style={{ ...item, padding: "6px 11px", borderTop: `1px solid ${color.line.DEFAULT}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fields.map((f) => r[f.label.toLowerCase()]).filter(Boolean).join(" · ") || "—"}</div>)}
                </div>
              </div>
            )}
            {msg && <div style={{ fontSize: 13, color: msg.startsWith("Imported") ? color.status.positive : color.status.negative, marginBottom: 10 }}>{msg}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setOpen(false)} style={{ height: uiConstants.control.height, padding: "0 14px", borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={run} disabled={busy || valid.length === 0} style={{ height: uiConstants.control.height, padding: "0 16px", borderRadius: 8, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 13, fontWeight: 700, cursor: busy || valid.length === 0 ? "default" : "pointer", opacity: busy || valid.length === 0 ? 0.5 : 1 }}>{busy ? "Importing…" : `Import ${valid.length}`}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
