"use client";

import * as React from "react";

type Line = { name: string; qty: number; unitPrice: number; lineTotal: number };
type Q = { number: string; status: string; total: number; subtotal: number; vatTotal: number; currency: string; valid: string | null; customer: string; merchant: string; logoUrl: string | null; accent: string; notes: string | null; lines: Line[] };
const INK = "#1d2733", MUT = "#5b6b7b", LINE = "#e4e9ef";
const money = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuoteTokenPage({ params }: { params: { token: string } }) {
  const [q, setQ] = React.useState<Q | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [decided, setDecided] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/public/quote/${params.token}`).then((r) => r.json()).then((d) => {
      if (d.error) setErr(d.error); else { setQ(d); if (["ACCEPTED", "REJECTED", "INVOICED"].includes(d.status)) setDecided(d.status); }
      setLoading(false);
    }).catch(() => { setErr("Could not load"); setLoading(false); });
  }, [params.token]);

  async function decide(action: "accept" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/public/quote/${params.token}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const d = await res.json();
      if (res.ok) setDecided(d.status || d.already || (action === "accept" ? "ACCEPTED" : "REJECTED"));
    } finally { setBusy(false); }
  }

  const accent = q?.accent || "#0064d9";
  const wrap: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(160deg,#eef3f7,#e2ecf0)", padding: "44px 16px", fontFamily: "Inter, system-ui, sans-serif", color: INK };
  const card: React.CSSProperties = { maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px -20px rgba(20,40,60,0.28)", overflow: "hidden" };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ height: 5, background: accent }} />
        <div style={{ padding: 26 }}>
          {loading ? <div style={{ padding: 40, textAlign: "center", color: MUT }}>Loading…</div>
            : err ? <div style={{ padding: 40, textAlign: "center", color: "#b3261e" }}>{err}</div>
              : q ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      {q.logoUrl ? <img src={q.logoUrl} alt={q.merchant} style={{ height: 34, marginBottom: 6 }} /> : <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{q.merchant}</div>}
                      <div style={{ fontSize: 13, color: MUT }}>Quotation for {q.customer}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: accent }}>QUOTE</div>
                      <div style={{ fontSize: 13, color: MUT }}>{q.number}</div>
                      {q.valid ? <div style={{ fontSize: 12, color: MUT }}>Valid until {q.valid}</div> : null}
                    </div>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 8 }}>
                    <thead><tr style={{ borderBottom: `1px solid ${LINE}`, color: MUT, textAlign: "left" }}><th style={{ padding: "8px 0" }}>Item</th><th style={{ textAlign: "right" }}>Qty</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
                    <tbody>{q.lines.map((l, i) => <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}><td style={{ padding: "9px 0" }}>{l.name}</td><td style={{ textAlign: "right", color: MUT }}>{Number(l.qty)}</td><td style={{ textAlign: "right", fontWeight: 600 }}>{money(l.lineTotal, q.currency)}</td></tr>)}</tbody>
                  </table>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
                    <div style={{ width: 220 }}>
                      <Row k="Subtotal" v={money(q.subtotal, q.currency)} />
                      <Row k="VAT" v={money(q.vatTotal, q.currency)} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, padding: "8px 0", borderTop: `2px solid ${accent}`, color: accent }}><span>Total</span><span>{money(q.total, q.currency)}</span></div>
                    </div>
                  </div>
                  {q.notes ? <div style={{ fontSize: 13, color: MUT, borderTop: `1px solid ${LINE}`, paddingTop: 12, marginBottom: 18 }}>{q.notes}</div> : null}

                  {decided ? (
                    <div style={{ textAlign: "center", padding: "16px", borderRadius: 12, background: decided === "ACCEPTED" || decided === "INVOICED" ? "#e7f7ee" : "#fdeceb", color: decided === "ACCEPTED" || decided === "INVOICED" ? "#188918" : "#b3261e", fontWeight: 700 }}>
                      {decided === "ACCEPTED" || decided === "INVOICED" ? "✓ Quote accepted — thank you!" : "Quote declined."}
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => decide("accept")} disabled={busy} style={{ flex: 2, height: 48, border: 0, borderRadius: 11, background: accent, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{busy ? "…" : "Accept quote"}</button>
                      <button onClick={() => decide("reject")} disabled={busy} style={{ flex: 1, height: 48, borderRadius: 11, border: `1px solid ${LINE}`, background: "#fff", color: MUT, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Decline</button>
                    </div>
                  )}
                </>
              ) : null}
        </div>
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: MUT, marginTop: 16 }}>Powered by Xentral</p>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5b6b7b", padding: "3px 0" }}><span>{k}</span><span>{v}</span></div>;
}
