"use client";

import * as React from "react";
import { color } from "@xentral/config";

const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 11px", borderRadius: 8, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, color: color.ink.mid, fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none", cursor: "pointer" };
const iconBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, color: color.ink.mid, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", flexShrink: 0 };
const menu: React.CSSProperties = { position: "absolute", right: 0, top: 40, minWidth: 210, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, boxShadow: "0 12px 32px -8px rgba(20,28,38,0.25)", zIndex: 60, padding: 6 };
const item: React.CSSProperties = { display: "block", padding: "9px 12px", fontSize: 13, color: color.ink.DEFAULT, textDecoration: "none", borderRadius: 7, whiteSpace: "nowrap" };

/** Inline stroke icons (16px, currentColor). Crisp at the top-bar scale. */
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const p: React.SVGProps<SVGSVGElement> = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "search": return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>;
    case "growth": return <svg {...p}><path d="M3 17l6-6 4 4 7-7" /><path d="M17 7h4v4" /></svg>;
    case "credits": return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.2c0-1 .9-1.7 2.4-1.7s2.5.6 2.5 1.6c0 2.4-4.9 1.2-4.9 3.6 0 1 1 1.7 2.5 1.7s2.5-.7 2.5-1.7" /></svg>;
    case "pin": return <svg {...p}><path d="M12 21s-6.5-5.4-6.5-10.2A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.8C18.5 15.6 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.3" /></svg>;
    case "bell": return <svg {...p}><path d="M18 8a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 14 18 8Z" /><path d="M10.5 19a1.8 1.8 0 0 0 3 0" /></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "refresh": return <svg {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 4v5h-5" /></svg>;
    case "chevron": return <svg {...p} width={12} height={12}><path d="m6 9 6 6 6-6" /></svg>;
    default: return null;
  }
}

function useToggle() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (!open) return; const h = () => setOpen(false); document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, [open]);
  return [open, setOpen] as const;
}
const go = (href: string) => () => { window.location.href = href; };

export function HeaderSearch() {
  const [v, setV] = React.useState("");
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      <span style={{ position: "absolute", left: 11, color: color.ink.soft, display: "inline-flex", pointerEvents: "none" }}><Icon name="search" size={15} /></span>
      <input value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) window.location.href = "/contacts?q=" + encodeURIComponent(v.trim()); }}
        placeholder="Search contacts, companies, deals…" aria-label="Search"
        style={{ width: 248, height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 12px 0 34px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box" }} />
    </span>
  );
}

/** Functional pills + icon buttons (create menu, notifications, refresh) with crisp SVG icons. */
export function HeaderTools() {
  const [createOpen, setCreate] = useToggle();
  const [noteOpen, setNote] = useToggle();
  return (
    <>
      <a href="/billing" style={pill}><Icon name="growth" size={15} />Growth</a>
      <a href="/credits" style={pill}><Icon name="credits" size={15} />AED 999</a>
      <a href="/org/branches" style={pill}><Icon name="pin" size={15} />All locations <Icon name="chevron" /></a>

      {/* Notifications */}
      <span style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setNote((o) => !o)} aria-label="Notifications" style={iconBtn}><Icon name="bell" /></button>
        {noteOpen ? (
          <div style={menu}>
            <div style={{ padding: "8px 12px 6px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" }}>Notifications</div>
            <div style={{ padding: "10px 12px", fontSize: 13, color: color.ink.mid }}>You&rsquo;re all caught up. ✓</div>
            <div style={{ height: 1, background: color.line.DEFAULT, margin: "5px 6px" }} />
            <a href="/inbox" style={item} onClick={go("/inbox")}>Open WhatsApp inbox</a>
          </div>
        ) : null}
      </span>

      {/* Create (+) */}
      <span style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setCreate((o) => !o)} aria-label="Create new" style={{ ...iconBtn, background: color.brand.primary, color: color.ink.onPrimary, border: 0 }}><Icon name="plus" /></button>
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
      <button onClick={() => window.location.reload()} aria-label="Refresh" style={iconBtn}><Icon name="refresh" /></button>
    </>
  );
}

export function HeaderAvatar({ label = "MF" }: { label?: string }) {
  const [open, setOpen] = useToggle();
  return (
    <span style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open}
        style={{ width: 32, height: 32, borderRadius: "50%", border: 0, background: color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{label}</button>
      {open ? (
        <div style={menu}>
          <div style={{ padding: "8px 12px 6px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" }}>Workspace</div>
          <a href="/settings" style={item} onClick={go("/settings")}>Settings</a>
          <a href="/settings/email" style={item} onClick={go("/settings/email")}>Email settings</a>
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
