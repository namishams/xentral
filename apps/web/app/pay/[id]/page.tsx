"use client";

import * as React from "react";

type Inv = { id: string; number: string; status: string; total: number; balance: number; currency: string; due: string | null; customer: string; merchant: string };

const TEAL = "#0098a6"; // Telr brand teal
const INK = "#1d2733";
const MUT = "#5b6b7b";
const LINE = "#e4e9ef";
const money = (n: number, c = "AED") => `${c} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function TelrMark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 800, fontSize: size, color: TEAL, letterSpacing: -0.5 }}>
      <span style={{ width: size + 4, height: size + 4, borderRadius: 7, background: TEAL, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size - 6, fontWeight: 900 }}>t</span>
      telr
    </span>
  );
}

export default function PayPage({ params }: { params: { id: string } }) {
  const [inv, setInv] = React.useState<Inv | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [step, setStep] = React.useState<"review" | "card" | "done">("review");
  const [paying, setPaying] = React.useState(false);
  const [ref, setRef] = React.useState("");
  const [err, setErr] = React.useState("");
  const [card, setCard] = React.useState({ name: "", number: "", exp: "", cvv: "" });

  React.useEffect(() => {
    fetch(`/api/public/invoice/${params.id}`).then((r) => r.json()).then((d) => {
      if (d.error) setErr(d.error); else { setInv(d); if (d.balance <= 0) setStep("done"); }
      setLoading(false);
    }).catch(() => { setErr("Could not load invoice"); setLoading(false); });
  }, [params.id]);

  const amt = inv ? (inv.balance > 0 ? inv.balance : inv.total) : 0;
  const cardValid = card.name.trim() && card.number.replace(/\s/g, "").length >= 12 && card.exp.length >= 4 && card.cvv.length >= 3;

  async function pay() {
    setPaying(true); setErr("");
    await new Promise((r) => setTimeout(r, 1100)); // simulate 3-D Secure round-trip
    try {
      const res = await fetch(`/api/public/invoice/${params.id}/pay`, { method: "POST" });
      const d = await res.json();
      if (res.ok) { setRef(d.reference || "TELR-OK"); setStep("done"); }
      else { setErr(d.error || "Payment declined"); }
    } catch { setErr("Network error"); } finally { setPaying(false); }
  }

  const wrap: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(160deg,#eef3f7,#e2ecf0)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 16px", fontFamily: "Inter, system-ui, sans-serif", color: INK };
  const cardBox: React.CSSProperties = { width: "100%", maxWidth: 460, background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px -20px rgba(20,40,60,0.28)", overflow: "hidden" };
  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 44, border: `1px solid ${LINE}`, borderRadius: 9, padding: "0 13px", fontSize: 14.5, color: INK, outline: "none", marginBottom: 12 };
  const lab: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: MUT, textTransform: "uppercase", marginBottom: 5 };

  return (
    <div style={wrap}>
      <div style={cardBox}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{inv?.merchant || "Xentral"}</span>
          <span style={{ fontSize: 12, color: MUT }}>Secure checkout</span>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: MUT }}>Loading…</div>
        ) : err && !inv ? (
          <div style={{ padding: 48, textAlign: "center", color: "#b3261e" }}>{err}</div>
        ) : step === "done" ? (
          <div style={{ padding: "40px 28px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e7f7ee", color: "#188918", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>✓</div>
            <h1 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 6px" }}>Payment successful</h1>
            <p style={{ color: MUT, fontSize: 14, margin: "0 0 18px" }}>{money(amt, inv?.currency)} paid for invoice {inv?.number}</p>
            <div style={{ background: "#f6f9fb", border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: MUT, display: "inline-block" }}>Reference: <b style={{ color: INK }}>{ref || "PAID"}</b></div>
            <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: MUT, fontSize: 12 }}>Payments by <TelrMark size={15} /></div>
          </div>
        ) : step === "review" ? (
          <div style={{ padding: "28px 28px 24px" }}>
            <div style={{ fontSize: 12.5, color: MUT, marginBottom: 6 }}>Invoice {inv?.number} · {inv?.customer}</div>
            <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>{money(amt, inv?.currency)}</div>
            <div style={{ fontSize: 13, color: MUT, marginBottom: 22 }}>{inv?.due ? `Due ${inv.due}` : "Amount due"}</div>
            <div style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: "14px 0", margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 9 }}>
              <Row k="Invoice" v={inv?.number || "—"} />
              <Row k="Billed to" v={inv?.customer || "—"} />
              <Row k="Amount" v={money(amt, inv?.currency)} bold />
            </div>
            <button onClick={() => setStep("card")} style={{ width: "100%", height: 50, border: 0, borderRadius: 11, background: TEAL, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Pay {money(amt, inv?.currency)}</button>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: MUT, fontSize: 12 }}>🔒 Secured by <TelrMark size={15} /></div>
          </div>
        ) : (
          <div style={{ padding: "24px 28px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <TelrMark />
              <span style={{ fontSize: 18, fontWeight: 800 }}>{money(amt, inv?.currency)}</span>
            </div>
            {err ? <div style={{ background: "#fdeceb", color: "#b3261e", border: "1px solid #f3b6b1", borderRadius: 9, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>{err}</div> : null}
            <label style={lab}>Cardholder name</label>
            <input style={field} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Name on card" />
            <label style={lab}>Card number</label>
            <input style={field} value={card.number} inputMode="numeric" onChange={(e) => { let v = e.target.value.replace(/[^\d]/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); setCard({ ...card, number: v }); }} placeholder="4242 4242 4242 4242" />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><label style={lab}>Expiry</label><input style={field} value={card.exp} inputMode="numeric" onChange={(e) => { let v = e.target.value.replace(/[^\d]/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); setCard({ ...card, exp: v }); }} placeholder="MM/YY" /></div>
              <div style={{ flex: 1 }}><label style={lab}>CVV</label><input style={field} value={card.cvv} inputMode="numeric" onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })} placeholder="123" /></div>
            </div>
            <button onClick={pay} disabled={!cardValid || paying} style={{ width: "100%", height: 50, border: 0, borderRadius: 11, background: cardValid && !paying ? TEAL : "#9fc7cd", color: "#fff", fontSize: 16, fontWeight: 700, cursor: cardValid && !paying ? "pointer" : "default", marginTop: 6 }}>{paying ? "Authorising…" : `Pay ${money(amt, inv?.currency)}`}</button>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: MUT, fontSize: 11.5 }}><span>VISA</span><span>Mastercard</span><span>·</span><span>3-D Secure</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}><span style={{ color: MUT }}>{k}</span><span style={{ color: INK, fontWeight: bold ? 700 : 500 }}>{v}</span></div>;
}
