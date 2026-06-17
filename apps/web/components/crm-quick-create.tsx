"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { Button } from "@xentral/ui";

type Entity = "contact" | "company" | "lead";
type Field = { key: string; label: string; placeholder?: string; type?: string; required?: boolean };

const FIELDS: Record<Entity, { title: string; fields: Field[] }> = {
  contact: { title: "New contact", fields: [
    { key: "firstName", label: "First name", required: true },
    { key: "lastName", label: "Last name" },
    { key: "title", label: "Job title" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
  ] },
  company: { title: "New company", fields: [
    { key: "name", label: "Company name", required: true },
    { key: "industry", label: "Industry" },
    { key: "website", label: "Website", placeholder: "https://…" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
  ] },
  lead: { title: "New lead", fields: [
    { key: "firstName", label: "First name", required: true },
    { key: "lastName", label: "Last name" },
    { key: "company", label: "Company" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "value", label: "Value (AED)", type: "number" },
  ] },
};

const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", marginBottom: 12 };

export function NewCrmButton({ entity, label }: { entity: Entity; label: string }) {
  const cfg = FIELDS[entity];
  const [open, setOpen] = React.useState(false);
  const [vals, setVals] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const required = cfg.fields.find((f) => f.required)!;
  const ok = (vals[required.key] ?? "").trim().length > 0;

  function reset() { setVals({}); setOpen(false); }
  async function save() {
    if (!ok) return;
    setSaving(true);
    try {
      const res = await fetch("/api/crm/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entity, ...vals }) });
      if (res.ok) { reset(); window.location.reload(); }
      else { const j = await res.json().catch(() => ({})); alert(j.error || "Could not create"); }
    } finally { setSaving(false); }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>{label}</Button>
      {open ? (
        <div onClick={() => !saving && reset()} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 22, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>{cfg.title}</h2>
              <button aria-label="Close" onClick={reset} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            {cfg.fields.map((f) => (
              <div key={f.key}>
                <label style={lbl}>{f.label}{f.required ? " *" : ""}</label>
                <input type={f.type ?? "text"} value={vals[f.key] ?? ""} placeholder={f.placeholder} autoFocus={f.required}
                  onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter" && ok) save(); }} style={inp} />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
              <Button onClick={reset} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={save} disabled={saving || !ok}>{saving ? "Saving…" : "Create"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
