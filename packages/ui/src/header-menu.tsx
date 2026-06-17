"use client";

import * as React from "react";
import { color } from "@xentral/config";

const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 10px", borderRadius: 8, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, color: color.ink.mid, fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none", cursor: "pointer" };
const iconBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, color: color.ink.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", position: "relative", flexShrink: 0 };
const menu: React.CSSProperties = { position: "absolute", right: 0, top: 38, minWidth: 210, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, boxShadow: "0 12px 32px -8px rgba(20,28,38,0.25)", zIndex: 60, padding: 6 };
const item: React.CSSProperties = { display: "block", padding: "9px 12px", fontSize: 13, color: color.ink.DEFAULT, textDecoration: "none", borderRadius: 7, whiteSpace: "nowrap" };

function useToggle() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (!open) return; const h = () => setOpen(false); document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, [open]);
  return [open, setOpen] as const;
}
const go = (href: string) => () => { window.location.href = href; };

export function HeaderSearch() {
  const [v, setV] = React.useState("");
  return (
    <input value={v} onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) window.location.href = "/contacts?q=" + encodeURIComponent(v.trim()); }}
      placeholder="Search contacts, companies, deals…" aria-label="Search"
      style={{ width: 240, height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 12px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box" }} />
  );
}

/** Functional pills + icon buttons (create menu, notifications, refresh). */
export function HeaderTools() {
  const [createOpen, setCreate] = useToggle();
  const [noteOpen, setNote] = useToggle();
  return (
    <>
      <a href="/settings" style={pill}>＄ Growth</a>
      <a href="/settings" style={pill}>◳ AED 999</a>
      <a href="/org/branches" style={pill}>⌖ All locations ▾</a>

      {/* Notifications */}
      <span style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setNote((o) => !o)} aria-label="Notifications" style={iconBtn}>♪</button>
        {noteOpen ? (
          <div style={menu}>
            <div style={{ padding: "8px 12px 6px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" }}>Notifications</div>
            <div style={{ padding: "10px 12px", fontSize: 13, color: color.ink.mid }}>You're all caught up. ✓</div>
            <div style={{ height: 1, background: color.line.DEFAULT, margin: "5px 6px" }} />
            <a href="/inbox" style={item} onClick={go("/inbox")}>Open WhatsApp inbox</a>
          </div>
        ) : null}
      </span>

      {/* Create (+) */}
      <span style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setCreate((o) => !o)} aria-label="Create new" style={iconBtn}>＋</button>
        {createOpen ? (
          <div style={menu}>
            <div style={{ padding: "8px 12px 6px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" }}>Create</div>
            <a href="/contacts" style={item} onClick={go("/contacts")}>New contact</a>
            <a href="/companies" style={item} onClick={go("/companies")}>New company</a>
            <a href="/deals" style={item} onClick={go("/deals")}>New deal</a>
            <a href="/quotations" style={item} onClick={go("/quotations")}>New quote</a>
            <a href="/invoices" style={item} onClick={go("/invoices")}>New invoice</a>
          </div>
        ) : null}
      </span>

      {/* Refresh */}
      <button onClick={() => window.location.reload()} aria-label="Refresh" style={iconBtn}>⟳</button>
    </>
  );
}

export function HeaderAvatar({ label = "MF" }: { label?: string }) {
  const [open, setOpen] = useToggle();
  return (
    <span style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open}
        style={{ width: 30, height: 30, borderRadius: "50%", border: 0, background: color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{label}</button>
      {open ? (
        <div style={menu}>
          <div style={{ padding: "8px 12px 6px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" }}>Workspace</div>
          <a href="/settings" style={item} onClick={go("/settings")}>Settings</a>
          <a href="/settings/ai-hub" style={item} onClick={go("/settings/ai-hub")}>AI Hub</a>
          <a href="/users" style={item} onClick={go("/users")}>Users &amp; roles</a>
          <a href="/marketplace/purchases" style={item} onClick={go("/marketplace/purchases")}>Purchased leads</a>
          <div style={{ height: 1, background: color.line.DEFAULT, margin: "5px 6px" }} />
          <a href="/api/auth/logout" style={{ ...item, color: color.status.negative, fontWeight: 600 }}>Sign out</a>
        </div>
      ) : null}
    </span>
  );
}
