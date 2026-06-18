"use client";

import * as React from "react";

type Line = { name: string; qty: number | string; unitPrice: number | string; lineTotal: number | string };
type Data = {
  id: string; number: string; status: string; total: number; subtotal: number; vatTotal: number; amountPaid: number; balance: number;
  currency: string; issued: string | null; due: string | null; customer: string; merchant: string; logoUrl: string | null; accent: string; notes: string | null;
  bank: { bankName: string | null; accountName: string | null; iban: string | null }; lines: Line[];
};

const aed = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PublicInvoicePage({ params }: { params: { token: string } }) {
  const [d, setD] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch(`/api/public/i/${params.token}`).then((r) => r.json()).then((j) => { setD(j.error ? null : j); setLoading(false); }).catch(() => setLoading(false));
  }, [params.token]);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#5b6b7b", fontFamily: "Inter, sans-serif" }}>Loading…</div>;
  if (!d) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#5b6b7b", fontFamily: "Inter, sans-serif" }}>Invoice not found or no longer available.</div>;

  const accent = /^#[0-9a-fA-F]{6}$/.test(d.accent) ? d.accent : "#0064d9";
  const paid = d.status === "PAID" || d.balance <= 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", padding: "32px 16px", fontFamily: "Inter, system-ui, sans-serif", color: "#1d2733" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#5b6b7b" }}>Invoice from <b style={{ color: "#1d2733" }}>{d.merchant}</b></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => window.print()} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid #dce2ea", background: "#fff", fontSize: 13, fontWeight: 600, color: "#1d2733", cursor: "pointer" }}>Print</button>
            {!paid ? <a href={`/pay/${d.id}`} style={{ height: 36, padding: "0 16px", borderRadius: 9, background: accent, color: "#fff", fontSize: 13.5, fontWeight: 700, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Pay {aed(d.balance, d.currency)}</a> : null}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 12px 40px -18px rgba(20,28,38,0.25)", overflow: "hidden" }}>
          <div style={{ height: 5, background: accent }} />
          <div style={{ padding: 30 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <div>
                {d.logoUrl ? <img src={d.logoUrl} alt={d.merchant} style={{ height: 40, marginBottom: 8 }} /> : <div style={{ width: 42, height: 42, borderRadius: 10, background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{d.merchant[0]}</div>}
                <div style={{ fontWeight: 800, fontSize: 16 }}>{d.merchant}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: 1 }}>INVOICE</div>
                <div style={{ fontSize: 13, color: "#5b6b7b" }}>{d.number}</div>
                <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: paid ? "#188918" : "#b25d00", background: paid ? "#e9f6ec" : "#fdf2e3", borderRadius: 999, padding: "3px 10px" }}>{paid ? "Paid" : "Due"}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8a97a5", marginBottom: 4 }}>Bill to</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{d.customer}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12.5, color: "#5b6b7b" }}>
                <div>Issued: <b style={{ color: "#1d2733" }}>{d.issued || "—"}</b></div>
                <div>Due: <b style={{ color: "#1d2733" }}>{d.due || "—"}</b></div>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${accent}` }}>
                  <th style={{ textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#8a97a5", padding: "0 0 8px" }}>Description</th>
                  <th style={{ textAlign: "right", fontSize: 11, textTransform: "uppercase", color: "#8a97a5", padding: "0 0 8px", width: 60 }}>Qty</th>
                  <th style={{ textAlign: "right", fontSize: 11, textTransform: "uppercase", color: "#8a97a5", padding: "0 0 8px", width: 120 }}>Unit</th>
                  <th style={{ textAlign: "right", fontSize: 11, textTransform: "uppercase", color: "#8a97a5", padding: "0 0 8px", width: 130 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {d.lines.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eef1f5" }}>
                    <td style={{ padding: "10px 0", fontSize: 13, fontWeight: 500 }}>{l.name}</td>
                    <td style={{ padding: "10px 0", fontSize: 13, textAlign: "right", color: "#5b6b7b" }}>{Number(l.qty)}</td>
                    <td style={{ padding: "10px 0", fontSize: 13, textAlign: "right", color: "#5b6b7b" }}>{aed(Number(l.unitPrice), d.currency)}</td>
                    <td style={{ padding: "10px 0", fontSize: 13, textAlign: "right", fontWeight: 600 }}>{aed(Number(l.lineTotal), d.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <div style={{ width: 260 }}>
                <Row k="Subtotal" v={aed(d.subtotal, d.currency)} />
                <Row k="VAT" v={aed(d.vatTotal, d.currency)} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, padding: "8px 0", borderTop: `2px solid ${accent}`, color: accent }}><span>Total</span><span>{aed(d.total, d.currency)}</span></div>
                {d.amountPaid > 0 ? <Row k="Paid" v={`− ${aed(d.amountPaid, d.currency)}`} /> : null}
                {d.balance > 0 ? <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, padding: "4px 0", color: "#b25d00" }}><span>Balance due</span><span>{aed(d.balance, d.currency)}</span></div> : null}
              </div>
            </div>

            {(d.bank.iban || d.bank.bankName) ? (
              <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid #eef1f5" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8a97a5", marginBottom: 6 }}>Payment details</div>
                <div style={{ fontSize: 12.5, color: "#1d2733", lineHeight: 1.8 }}>
                  {d.bank.accountName ? <div>Account: <b>{d.bank.accountName}</b></div> : null}
                  {d.bank.bankName ? <div>Bank: <b>{d.bank.bankName}</b></div> : null}
                  {d.bank.iban ? <div>IBAN: <b>{d.bank.iban}</b></div> : null}
                </div>
              </div>
            ) : null}

            {d.notes ? <div style={{ marginTop: 18, fontSize: 12, color: "#5b6b7b", borderTop: "1px solid #eef1f5", paddingTop: 12 }}>{d.notes}</div> : null}
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 11.5, color: "#8a97a5", marginTop: 16 }}>Powered by Xentral</p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5b6b7b", padding: "3px 0" }}><span>{k}</span><span>{v}</span></div>;
}
