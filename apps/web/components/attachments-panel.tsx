"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { Panel, PanelHeader, PanelBody, Button } from "@xentral/ui";

type Att = { id: string; fileName: string; size: number; filePath: string; createdAt: string };

const fsize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function AttachmentsPanel({ docType, docId }: { docType: "QUOTE" | "INVOICE" | "CUSTOMER"; docId: string }) {
  const [files, setFiles] = React.useState<Att[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(() => {
    fetch(`/api/books/attachments?docType=${docType}&docId=${docId}`).then((r) => r.json()).then((d) => setFiles(Array.isArray(d) ? d : [])).catch(() => {});
  }, [docType, docId]);
  React.useEffect(() => { load(); }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setErr("");
    const fd = new FormData(); fd.append("file", file); fd.append("docType", docType); fd.append("docId", docId);
    try {
      const r = await fetch("/api/books/attachments", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.error || "Upload failed"); return; }
      load();
    } finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function remove(att: Att) {
    if (!confirm(`Remove "${att.fileName}"?`)) return;
    const r = await fetch(`/api/books/attachments/${att.id}`, { method: "DELETE" });
    if (r.ok) load();
  }

  return (
    <Panel>
      <PanelHeader title="Attachments" subtitle={`${files.length} ${files.length === 1 ? "file" : "files"}`}
        actions={<><input ref={inputRef} type="file" style={{ display: "none" }} onChange={upload} /><Button onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? "Uploading…" : "Upload"}</Button></>} />
      <PanelBody flush>
        {err ? <div style={{ padding: "8px 16px", fontSize: 12, color: color.status.critical }}>{err}</div> : null}
        {files.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No files attached. Add specs, drawings or signed POs.</div>
        ) : files.map((f) => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
            <span style={{ width: 26, height: 26, borderRadius: 6, background: color.surface.sunken, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📎</span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <a href={f.filePath} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT, textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.fileName}</a>
              <span style={{ fontSize: 11, color: color.ink.soft }}>{fsize(f.size)} · {f.createdAt}</span>
            </span>
            <button aria-label="Remove" onClick={() => remove(f)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.soft, cursor: "pointer", flexShrink: 0 }}>×</button>
          </div>
        ))}
      </PanelBody>
    </Panel>
  );
}
