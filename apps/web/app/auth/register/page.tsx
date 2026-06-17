"use client";

import * as React from "react";
import { XentralMark } from "@xentral/ui";

/* Faithful 1:1 port of the live app's two-step Create-Account (Account → Company).
 * Posts to /api/auth/register (the registration backend is ported next; dormant on
 * preview → friendly notice). Tailwind via CDN, real Xentral mark, no external deps. */

const COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman", "Egypt", "Jordan", "Lebanon", "Pakistan", "India", "Philippines", "United Kingdom", "Germany", "USA", "Other"];

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#5d6e80] mb-1.5">
        {label}{required && <span className="text-[#a8302a] ml-0.5">*</span>}
        {hint && <span className="text-[#a6b0ba] font-normal ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
function Input({ type = "text", value, onChange, placeholder }: { type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    className="w-full px-4 py-2.5 bg-white border border-[#dcdfe3] rounded-xl text-sm text-[#20303f] placeholder-gray-500 focus:outline-none focus:border-[#0064d9]" />;
}

export default function RegisterPage() {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  const [companyName, setCompanyName] = React.useState("");
  const [companyPhone, setCompanyPhone] = React.useState("");
  const [companyWhatsApp, setCompanyWhatsApp] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [taxNumber, setTaxNumber] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [country, setCountry] = React.useState("United Arab Emirates");

  const strength = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const strengthScore = strength.filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strengthScore] ?? "";
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"][strengthScore] ?? "";

  const validateStep1 = () => {
    if (!name.trim()) { setError("Full name is required"); return false; }
    if (!email.includes("@")) { setError("Enter a valid email address"); return false; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return false; }
    if (password !== confirm) { setError("Passwords do not match"); return false; }
    return true;
  };
  const goToStep2 = () => { setError(""); if (validateStep1()) setStep(2); };

  const handleSubmit = async () => {
    setError(""); setInfo("");
    if (!companyName.trim()) { setError("Company name is required"); return; }
    if (!companyPhone.trim()) { setError("Company phone is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, companyName, companyPhone, companyWhatsApp, address, taxNumber, website, country }),
      });
      if (res.ok) { window.location.href = "/dashboard"; return; }
      if (res.status === 503) { setInfo("Account creation activates when the workspace goes live. On the public preview the app runs on safe seed data."); }
      else { const d = await res.json().catch(() => ({})); setError(d.error || "Registration failed"); }
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#eef1f6", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(420px 380px at 22% 18%, rgba(124,92,252,0.28), transparent 70%),radial-gradient(460px 420px at 82% 24%, rgba(59,130,246,0.24), transparent 70%),radial-gradient(520px 460px at 30% 88%, rgba(236,72,153,0.18), transparent 72%),radial-gradient(480px 420px at 78% 84%, rgba(34,211,166,0.18), transparent 72%)" }} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <a href="https://xentral.ae" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5a6b7d] hover:text-[#20303f] transition-colors mb-4">← Back to home</a>
          <div className="flex justify-center mb-4"><XentralMark size={52} /></div>
          <h1 className="text-center text-[22px] font-bold text-[#20303f] tracking-tight mb-1">Create your account</h1>
          <p className="text-center text-[13.5px] text-[#7c8794] mb-7">Start free on the Sales Operating System</p>

          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s ? "bg-[#2e7d32] text-white" : step === s ? "bg-[#0064d9] text-white" : "bg-[#eef0f2] text-[#5d6e80]"}`}>{step > s ? "✓" : s}</div>
                <span className={`text-xs font-medium ${step >= s ? "text-[#5a6b7d]" : "text-[#a6b0ba]"}`}>{s === 1 ? "Account" : "Company"}</span>
                {s < 2 && <div className={`flex-1 h-px w-8 ${step > s ? "bg-[#2e7d32]" : "bg-[#e9eaec]"}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#e9eaec] rounded-xl p-8" style={{ boxShadow: "0 24px 60px -16px rgba(40,46,74,0.22)" }}>
            {error && <div className="flex items-center gap-2 bg-[#faeeed] border border-[#f0d6d4] text-[#a8302a] text-sm rounded-xl px-4 py-3 mb-5">✕ {error}</div>}
            {info && <div className="bg-[#eef4ff] border border-[#d6e4ff] text-[#0057be] text-[13px] rounded-xl px-4 py-3 mb-5">{info}</div>}

            {step === 1 ? (
              <>
                <h2 className="text-[#20303f] text-xl font-bold mb-1">Create your account</h2>
                <p className="text-[#7c8794] text-sm mb-6">Your login email is your username</p>
                <div className="space-y-4">
                  <Field label="Full Name" required><Input value={name} onChange={setName} placeholder="e.g. Ahmed Al Rashid" /></Field>
                  <Field label="Email Address (used to login)" required><Input type="email" value={email} onChange={setEmail} placeholder="you@company.com" /></Field>
                  <Field label="Password">
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters"
                        className="w-full pl-4 pr-14 py-2.5 bg-white border border-[#dcdfe3] rounded-xl text-sm text-[#20303f] placeholder-gray-500 focus:outline-none focus:border-[#0064d9]" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d6e80] text-xs font-semibold hover:text-[#20303f]">{showPassword ? "Hide" : "Show"}</button>
                    </div>
                    {password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">{[0, 1, 2, 3].map((i) => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strengthScore ? strengthColor : "bg-[#e9eaec]"}`} />)}</div>
                        <p className={`text-xs ${strengthColor.replace("bg-", "text-")}`}>{strengthLabel}</p>
                      </div>
                    )}
                  </Field>
                  <Field label="Confirm Password">
                    <div className="relative">
                      <input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password"
                        className={`w-full pl-4 pr-14 py-2.5 bg-white border rounded-xl text-sm text-[#20303f] placeholder-gray-500 focus:outline-none focus:border-[#0064d9] ${confirm && confirm !== password ? "border-red-500" : "border-[#dcdfe3]"}`} />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d6e80] text-xs font-semibold hover:text-[#20303f]">{showConfirm ? "Hide" : "Show"}</button>
                    </div>
                    {confirm && confirm !== password && <p className="text-xs text-[#a8302a] mt-1">Passwords do not match</p>}
                  </Field>
                </div>
                <button onClick={goToStep2} className="w-full mt-6 py-3 bg-[#0064d9] hover:bg-[#0057be] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">Continue →</button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => setStep(1)} className="text-[#5d6e80] hover:text-[#20303f] transition-colors text-lg">‹</button>
                  <h2 className="text-[#20303f] text-xl font-bold">Company Details</h2>
                </div>
                <p className="text-[#7c8794] text-sm mb-6 ml-6">This info is used on your invoices and for verification</p>
                <div className="space-y-4">
                  <Field label="Company / Clinic Name" required><Input value={companyName} onChange={setCompanyName} placeholder="e.g. HealthFirst Clinic LLC" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Company Phone" required><Input type="tel" value={companyPhone} onChange={setCompanyPhone} placeholder="+971 4 XXX XXXX" /></Field>
                    <Field label="WhatsApp Number"><Input type="tel" value={companyWhatsApp} onChange={setCompanyWhatsApp} placeholder="+971 50 XXX XXXX" /></Field>
                  </div>
                  <Field label="Company Address"><Input value={address} onChange={setAddress} placeholder="e.g. Business Bay, Dubai, UAE" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Country">
                      <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-[#dcdfe3] rounded-xl text-sm text-[#20303f] focus:outline-none focus:border-[#0064d9]">
                        {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Website"><Input value={website} onChange={setWebsite} placeholder="www.yoursite.com" /></Field>
                  </div>
                  <Field label="Trade License / TRN Number"><Input value={taxNumber} onChange={setTaxNumber} placeholder="e.g. 100XXXXXXXXXX003" /></Field>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="w-full mt-6 py-3 bg-[#0064d9] hover:bg-[#0057be] disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">{loading ? "Creating account…" : "Create Account"}</button>
                <p className="text-center text-xs text-[#a6b0ba] mt-3">Your account requires admin approval before marketplace access is granted</p>
              </>
            )}

            <div className="mt-5 text-center text-sm text-[#5d6e80]">Already have an account? <a href="/auth/login" className="text-[#0064d9] font-medium hover:text-[#0057be]">Sign in</a></div>
          </div>
        </div>
      </div>
    </div>
  );
}
