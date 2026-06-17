"use client";

import * as React from "react";

type Line = { name: string; description: string | null; qty: number; unitPrice: number; lineTotal: number };
type Q = { number: string; total: number; subtotal: number; vatTotal: number; currency: string; issued: string | null; valid: string | null; notes: string | null; customer: string; customerEmail: string | null };
type S = Record<string, string> & { templateConfig?: { accent?: string } };
const money = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotePrintPage({ params }: { params: { id: string } }) {
  const [q, setQ] = React.useState<Q | null>(null);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [s, setS] = React.useState<S>({});
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      fetch(`/api/books/quotes/${params.id}`).then((r) => r.json()),
      fetch(`/api/books/settings`).then((r) => r.json()).catch(() => ({ settings: {} })),
    ]).then(([d, sd]) => { setQ(d.quote ?? null); setLines(d.lines ?? []); setS(sd.settings ?? {}); setReady(true); });
  }, [params.id]);

  React.useEffect(() => { if (ready && q) { const t = setTimeout(() => window.print(), 600); return () => clearTimeout(t); } }, [ready, q]);

  if (!ready) return <div style={{ padding: 40, fontFamily: "Inter,sans-serif", color: "#5b6b7b" }}>Preparing…</div>;
  if (!q) return <div style={{ padding: 40, fontFamily: "Inter,sans-serif", color: "#b3261e" }}>Quote not found.</div>;

  const accent = s.templateConfig?.accent || "#0064d9";
  const merchant = s.legalName || "Xentral";

  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", color: "#1d2733", maxWidth: 760, margin: "0 auto", padding: "40px 44px", background: "#fff" }}>
      <style>{`@media print { @page { margin: 14mm; } .noprint { display:none } } body { background:#fff }`}</style>
      <div className="noprint" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button onClick={() => window.print()} style={{ background: accent, color: "#fff", border: 0, borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>Print / Save as PDF</button>
        <button onClick={() => window.close()} style={{ background: "#fff", color: "#5b6b7b", border: "1px solid #e4e9ef", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Close</button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `3px solid ${accent}`, paddingBottom: 18, marginBottom: 22 }}>
        <div>
          {s.logoUrl ? <img src={s.logoUrl} alt={merchant} style={{ height: 44, marginBottom: 8 }} /> : <div style={{ fontSize: 22, fontWeight: 800, color: accent, marginBottom: 4 }}>{merchant}</div>}
          {s.addressLine1 ? <div style={{ fontSize: 12, color: "#5b6b7b" }}>{s.addressLine1}{s.city ? `, ${s.city}` : ""}</div> : null}
          {s.vatNumber ? <div style={{ fontSize: 12, color: "#5b6b7b" }}>TRN {s.vatNumber}</div> : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: accent, letterSpacing: -0.5 }}>QUOTATION</div>
          <div style={{ fontSize: 13, color: "#5b6b7b" }}>{q.number}</div>
          {q.issued ? <div style={{ fontSize: 12, color: "#5b6b7b" }}>Issued {q.issued}</div> : null}
          {q.valid ? <div style={{ fontSize: 12, color: "#5b6b7b" }}>Valid until {q.valid}</div> : null}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "#8a97a5", textTransform: "uppercase", marginBottom: 4 }}>Prepared for</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{q.customer}</div>
        {q.customerEmail ? <div style={{ fontSize: 12.5, color: "#5b6b7b" }}>{q.customerEmail}</div> : null}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 18 }}>
        <thead><tr style={{ background: `color-mix(in srgb, ${accent} 8%, #fff)`, textAlign: "left", color: "#5b6b7b" }}>
          <th style={{ padding: "9px 10px" }}>Description</th><th style={{ textAlign: "right", padding: "9px 10px" }}>Qty</th><th style={{ textAlign: "right", padding: "9px 10px" }}>Unit price</th><th style={{ textAlign: "right", padding: "9px 10px" }}>Amount</th>
        </tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #e4e9ef" }}>
              <td style={{ padding: "9px 10px" }}>{l.name}{l.description ? <span style={{ display: "block", fontSize: 11.5, color: "#8a97a5" }}>{l.description}</span> : null}</td>
              <td style={{ textAlign: "right", padding: "9px 10px", color: "#5b6b7b" }}>{Number(l.qty)}</td>
              <td style={{ textAlign: "right", padding: "9px 10px", color: "#5b6b7b" }}>{money(l.unitPrice, q.currency)}</td>
              <td style={{ textAlign: "right", padding: "9px 10px", fontWeight: 600 }}>{money(l.lineTotal, q.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <div style={{ width: 260 }}>
          <Row k="Subtotal" v={money(q.subtotal, q.currency)} />
          <Row k="VAT (5%)" v={money(q.vatTotal, q.currency)} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, padding: "10px 0", borderTop: `2px solid ${accent}`, color: accent }}><span>Total</span><span>{money(q.total, q.currency)}</span></div>
        </div>
      </div>

      {(s.footerNotes || q.notes) ? <div style={{ fontSize: 12, color: "#5b6b7b", borderTop: "1px solid #e4e9ef", paddingTop: 12 }}>{q.notes || s.footerNotes}</div> : null}
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#5b6b7b", padding: "3px 0" }}><span>{k}</span><span>{v}</span></div>;
}
