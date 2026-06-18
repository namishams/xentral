"use client";

import * as React from "react";
import { XentralMark } from "@xentral/ui";

/* Dedicated platform-operator login (Xentral Admin · Mission Control).
 * Authenticates via /api/auth/login, then admits ONLY SUPER_ADMIN operators —
 * tenant logins are bounced with their session cleared. */
export default function OperatorLogin() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!r.ok) {
        setError(r.status === 401 ? "Invalid email or password." : r.status === 503 ? "Operator sign-in activates when the platform is live." : "Sign-in temporarily unavailable.");
        setLoading(false); return;
      }
      const me = await fetch("/api/me").then((x) => x.json()).catch(() => ({}));
      if (me && me.superAdmin) { window.location.href = "/admin"; return; }
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      setError("This account is not a platform operator. Use a tenant login at /auth/login.");
      setLoading(false);
    } catch { setError("Network error — please try again."); setLoading(false); }
  };

  const inp = "w-full h-[52px] px-4 bg-[#0f1722] border border-[#27323f] rounded-xl text-[15px] text-white placeholder:text-[#6b7a8d] focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/20 focus:outline-none transition-all";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden" style={{ background: "#0a0f17", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="pointer-events-none absolute inset-0" style={{ background:
        "radial-gradient(520px 460px at 24% 16%, rgba(59,130,246,0.22), transparent 70%)," +
        "radial-gradient(560px 480px at 80% 84%, rgba(34,211,166,0.16), transparent 72%)" }} />
      <div className="relative w-full max-w-[420px]">
        <div className="rounded-[20px] px-9 py-10 border" style={{ background: "#111a26", borderColor: "rgba(255,255,255,0.08)", boxShadow: "0 30px 70px -20px rgba(0,0,0,0.6)" }}>
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <span className="inline-flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, background: "#0064d9" }}><XentralMark size={24} /></span>
            <span className="text-white font-bold text-[18px] tracking-tight">Xentral <span className="font-medium text-[#8aa0b6]">Admin</span></span>
          </div>
          <h1 className="text-[20px] font-bold text-white text-center tracking-tight">Operator sign-in</h1>
          <p className="text-[13px] text-[#8aa0b6] text-center mt-2 mb-6">Platform Mission Control — operators only.</p>

          {error && <div className="mb-3.5 text-[13px] rounded-xl px-4 py-3" style={{ background: "rgba(204,25,25,0.12)", border: "1px solid rgba(204,25,25,0.4)", color: "#ff9a90" }}>{error}</div>}

          <form onSubmit={submit} className="space-y-3.5">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inp} placeholder="Operator email" autoComplete="email" autoFocus />
            <div className="relative">
              <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className={inp + " pr-12"} placeholder="Password" autoComplete="current-password" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7a8d] hover:text-white text-[13px] font-semibold">{show ? "Hide" : "Show"}</button>
            </div>
            <button type="submit" disabled={loading} className="w-full h-[52px] text-white rounded-xl font-semibold text-[15px] transition-colors disabled:opacity-60 flex items-center justify-center" style={{ background: "#0064d9", boxShadow: "0 8px 22px -8px rgba(0,100,217,0.7)" }}>{loading ? "Signing in…" : "Sign in to Mission Control"}</button>
          </form>

          <div className="mt-7 pt-5 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <a href="/auth/login" className="text-[13px] font-semibold text-[#8aa0b6] hover:text-white">← Tenant login</a>
          </div>
        </div>
        <p className="text-[12px] text-[#5d6e80] text-center mt-6">Xentral platform operator console</p>
      </div>
    </main>
  );
}
