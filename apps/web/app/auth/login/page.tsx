"use client";

import * as React from "react";
import { color } from "@xentral/config";

/* Branded sign-in — matches the live app's auth card (Fiori Horizon, Inter).
 * Presentational seam: the form posts to /api/auth/login, which is wired to the
 * real Xentral session at go-live. On the public preview no session backend is
 * active, so submitting shows a notice instead of authenticating. */

function Field({ label, type = "text", placeholder, value, onChange, autoFocus }: { label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label style={{ display: "block", marginBottom: 13 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: color.ink.mid, marginBottom: 5 }}>{label}</span>
      <input type={type} placeholder={placeholder} value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", height: 42, border: `1px solid ${color.line.strong}`, borderRadius: 9, padding: "0 13px", fontSize: 14, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box" }} />
    </label>
  );
}

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
      if (r.ok) { window.location.href = "/dashboard"; return; }
      if (r.status === 503) { setNotice("Sign-in activates when this workspace goes live. On the public preview the app runs on safe seed data."); }
      else if (r.status === 401) { setNotice("Email or password is incorrect."); }
      else { setNotice("Sign-in is temporarily unavailable. Please try again."); }
    } catch {
      setNotice("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: color.surface.page, color: color.ink.DEFAULT, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none", color: color.ink.DEFAULT, marginBottom: 22 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17 }}>✕</span>
        <span style={{ fontSize: 19, fontWeight: 700 }}>Xentral</span>
      </a>

      <form onSubmit={submit} style={{ width: "100%", maxWidth: 400, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 14, padding: "26px 26px 22px", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Sign in</h1>
        <p style={{ fontSize: 13.5, color: color.ink.mid, margin: "0 0 18px" }}>Welcome back to your workspace.</p>

        <Field label="Work email" type="email" placeholder="you@company.ae" value={email} onChange={setEmail} autoFocus />
        <Field label="Password" type="password" placeholder="••••••••" value={pw} onChange={setPw} />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <a href="/auth/reset" style={{ fontSize: 12.5, color: color.brand.primary, textDecoration: "none" }}>Forgot password?</a>
        </div>

        {notice ? <div style={{ fontSize: 12.5, color: color.ink.mid, background: color.brand.primaryTint, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, padding: "10px 12px", marginBottom: 14 }}>{notice}</div> : null}

        <button type="submit" disabled={busy} style={{ width: "100%", height: 44, borderRadius: 10, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 14.5, fontWeight: 600, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>{busy ? "Signing in…" : "Sign in"}</button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <span style={{ flex: 1, height: 1, background: color.line.DEFAULT }} />
          <span style={{ fontSize: 12, color: color.ink.soft }}>or</span>
          <span style={{ flex: 1, height: 1, background: color.line.DEFAULT }} />
        </div>
        <a href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 42, borderRadius: 10, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 14, fontWeight: 600, textDecoration: "none", boxSizing: "border-box" }}>Explore the demo workspace</a>
      </form>

      <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 16 }}>
        New to Xentral? <a href="/request-demo" style={{ color: color.brand.primary, textDecoration: "none", fontWeight: 600 }}>Request access</a>
      </div>
    </div>
  );
}
