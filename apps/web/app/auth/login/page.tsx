"use client";

import * as React from "react";
import { XentralMark } from "@xentral/ui";

/* Faithful port of the live app's login — premium mesh-background centered card.
 * Password mode posts to /api/auth/login (the SessionPort seam); email-code mode
 * is shown for parity and activates once the OTP backend is ported. */

export default function LoginPage() {
  const [mode, setMode] = React.useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const inp = "w-full h-[52px] px-4 bg-white border border-[#d9dce1] rounded-xl text-[15px] text-[#20303f] placeholder:text-[#6c7a89] hover:border-[#bcc3cc] focus:border-[#0064d9] focus:ring-4 focus:ring-[#0064d9]/10 focus:outline-none transition-all";

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (r.ok) { window.location.href = "/dashboard"; return; }
      if (r.status === 503) setError("Sign-in activates when the workspace goes live.");
      else if (r.status === 401) setError("Invalid email or password. Please try again.");
      else setError("Sign-in is temporarily unavailable. Please try again.");
    } catch { setError("Network error — please try again."); }
    setLoading(false);
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    setOtpSent(true);
    setInfo(`If an account exists for ${email}, a 6-digit code is on its way. (Email codes activate when the workspace goes live.)`);
  };
  const verifyCode = async (e: React.FormEvent) => { e.preventDefault(); setError("Email-code sign-in activates when the workspace goes live."); };
  const switchMode = (m: "password" | "otp") => { setMode(m); setError(""); setInfo(""); setOtpSent(false); setCode(""); };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden" style={{ background: "#eef1f6", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="pointer-events-none absolute inset-0" style={{ background:
        "radial-gradient(420px 380px at 22% 18%, rgba(124,92,252,0.28), transparent 70%)," +
        "radial-gradient(460px 420px at 82% 24%, rgba(59,130,246,0.24), transparent 70%)," +
        "radial-gradient(520px 460px at 30% 88%, rgba(236,72,153,0.18), transparent 72%)," +
        "radial-gradient(480px 420px at 78% 84%, rgba(34,211,166,0.18), transparent 72%)" }} />

      <div className="relative w-full max-w-[440px]">
        <a href="https://xentral.ae" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5a6b7d] hover:text-[#20303f] transition-colors mb-4">← Back to home</a>

        <div className="bg-white rounded-[20px] border border-white/70 px-9 sm:px-11 py-10" style={{ boxShadow: "0 2px 6px rgba(20,28,38,0.04), 0 24px 60px -16px rgba(40,46,74,0.22)" }}>
          <div className="flex justify-center mb-5"><XentralMark size={52} /></div>
          <h1 className="text-[24px] font-bold text-[#20303f] text-center tracking-tight">Welcome to Xentral</h1>
          <p className="text-[14px] text-[#7c8794] text-center mt-2 mb-6 leading-relaxed">Log in to your Sales Operating System.</p>

          <div className="mb-5 grid grid-cols-2 gap-1 bg-[#f1f3f6] border border-[#e5e8ec] rounded-xl p-1">
            <button type="button" onClick={() => switchMode("password")} className={`inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-[13px] font-semibold transition-colors ${mode === "password" ? "bg-white text-[#0064d9] shadow-sm" : "text-[#5a6b7d]"}`}>Password</button>
            <button type="button" onClick={() => switchMode("otp")} className={`inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-[13px] font-semibold transition-colors ${mode === "otp" ? "bg-white text-[#0064d9] shadow-sm" : "text-[#5a6b7d]"}`}>Email code</button>
          </div>

          {error && <div className="mb-3 bg-[#fdeeec] border border-[#f6d4cf] text-[#b3261e] text-[13px] rounded-xl px-4 py-3">{error}</div>}
          {info && <div className="mb-3 bg-[#eef4ff] border border-[#d6e4ff] text-[#0057be] text-[13px] rounded-xl px-4 py-3">{info}</div>}

          {mode === "password" ? (
            <form onSubmit={handlePassword} className="space-y-3.5">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inp} placeholder="Email address" autoComplete="email" autoFocus />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className={inp + " pr-12"} placeholder="Password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6c7a89] hover:text-[#20303f] text-[13px] font-semibold">{showPassword ? "Hide" : "Show"}</button>
              </div>
              <div className="pt-0.5"><a href="/auth/forgot-password" className="text-[13.5px] text-[#0064d9] font-semibold hover:underline">Reset password</a></div>
              <button type="submit" disabled={loading} className="w-full h-[52px] bg-[#0064d9] hover:bg-[#0057be] active:bg-[#004da6] text-white rounded-xl font-semibold text-[15px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1.5" style={{ boxShadow: "0 6px 18px -6px rgba(0,100,217,0.5)" }}>{loading ? "Logging in…" : "Log in"}</button>
            </form>
          ) : !otpSent ? (
            <form onSubmit={sendCode} className="space-y-3.5">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inp} placeholder="Email address" autoComplete="email" autoFocus />
              <button type="submit" className="w-full h-[52px] bg-[#0064d9] hover:bg-[#0057be] text-white rounded-xl font-semibold text-[15px] transition-colors flex items-center justify-center gap-2" style={{ boxShadow: "0 6px 18px -6px rgba(0,100,217,0.5)" }}>Send me a code →</button>
              <p className="text-center text-[12.5px] text-[#7c8794]">We'll email a 6-digit code — no password needed.</p>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-3.5">
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))} required className={inp + " text-center tracking-[10px] text-[20px] font-bold"} placeholder="••••••" autoFocus />
              <button type="submit" disabled={code.length < 6} className="w-full h-[52px] bg-[#0064d9] hover:bg-[#0057be] text-white rounded-xl font-semibold text-[15px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2" style={{ boxShadow: "0 6px 18px -6px rgba(0,100,217,0.5)" }}>Verify & log in</button>
              <button type="button" onClick={() => { setOtpSent(false); setCode(""); setError(""); }} className="w-full text-center text-[13px] font-semibold text-[#0064d9] hover:underline">Use a different email / resend</button>
            </form>
          )}

          <div className="mt-7 pt-5 border-t border-[#eef0f2] text-center">
            <p className="text-[13.5px] text-[#5a6b7d]">New to Xentral? <a href="/auth/register" className="text-[#0064d9] font-semibold hover:underline">Create an account</a></p>
          </div>
        </div>
        <p className="text-[12px] text-[#5d6e80] text-center mt-6">The Sales Operating System · <a href="https://xentral.ae" className="hover:text-[#5a6b7d]">xentral.ae</a></p>
      </div>
    </main>
  );
}
