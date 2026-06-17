"use client";

import * as React from "react";
import { color } from "@xentral/config";

/** Functional top-bar search — Enter routes to the contacts directory, filtered. */
export function HeaderSearch() {
  const [v, setV] = React.useState("");
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) window.location.href = "/contacts?q=" + encodeURIComponent(v.trim()); }}
      placeholder="Search contacts, companies, deals…"
      aria-label="Search"
      style={{ width: 260, height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 12px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box" }}
    />
  );
}

/** Workspace avatar with a working dropdown menu (right-aligned). */
export function HeaderAvatar({ label = "MF" }: { label?: string }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [open]);

  const item: React.CSSProperties = { display: "block", padding: "9px 12px", fontSize: 13, color: color.ink.DEFAULT, textDecoration: "none", borderRadius: 7, whiteSpace: "nowrap" };

  return (
    <span style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open}
        style={{ width: 30, height: 30, borderRadius: "50%", border: 0, background: color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{label}</button>
      {open ? (
        <div style={{ position: "absolute", right: 0, top: 38, minWidth: 210, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, boxShadow: "0 12px 32px -8px rgba(20,28,38,0.25)", zIndex: 60, padding: 6 }}>
          <div style={{ padding: "8px 12px 6px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" }}>Workspace</div>
          <a href="/settings" style={item} onMouseDown={(e) => { e.preventDefault(); }} onClick={() => (window.location.href = "/settings")}>Settings</a>
          <a href="/settings/ai-hub" style={item} onClick={() => (window.location.href = "/settings/ai-hub")}>AI Hub</a>
          <a href="/users" style={item} onClick={() => (window.location.href = "/users")}>Users &amp; roles</a>
          <a href="/marketplace/purchases" style={item} onClick={() => (window.location.href = "/marketplace/purchases")}>Purchased leads</a>
          <div style={{ height: 1, background: color.line.DEFAULT, margin: "5px 6px" }} />
          <a href="/api/auth/logout" style={{ ...item, color: color.status.negative, fontWeight: 600 }}>Sign out</a>
        </div>
      ) : null}
    </span>
  );
}
