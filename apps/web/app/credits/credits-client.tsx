"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, Button, Input } from "@xentral/ui";

type Bank = { bankName: string; accountName: string; iban: string; swift: string; currency: string; minAmount: number };
type Topup = { id: string; amount: number; status: string; reference: string | null; createdAt: string };
type Txn = { id: string; amount: number; type: string; description: string | null; balanceBefore: number; balanceAfter: number; createdAt: string };

const aed = (n: number) => `AED ${Number(n || 0).toLocaleString()}`;
const fmt = (d: string) => { try { return new Date(d).toLocaleString([], { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; } };

const STATUS_TONE: Record<string, string> = { PENDING: color.status.critical, APPROVED: color.status.positive, REJECTED: color.status.negative };

export function CreditsClient() {
  const [bank, setBank] = React.useState<Bank | null>(null);
  const [credits, setCredits] = React.useState(0);
  const [topups, setTopups] = React.useState<Topup[]>([]);
  const [txns, setTxns] = React.useState<Txn[]>([]);
  const [amount, setAmount] = React.useState("1000");
  const [reference, setReference] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const load = React.useCallback(() => {
    fetch("/api/credits/topup").then((r) => r.json()).then((d) => {
      setBank(d.bankDetails || null); setCredits(d.credits || 0);
      setTopups(Array.isArray(d.topups) ? d.topups : []); setTxns(Array.isArray(d.transactions) ? d.transactions : []);
    }).catch(() => {});
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function request() {
    const n = Number(String(amount).replace(/[^\d.]/g, ""));
    if (!n || n < 1000) { setMsg("Minimum top-up is AED 1,000."); return; }
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/credits/topup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: n, reference }) });
      const d = await r.json();
      if (r.ok && d.success) { setMsg(`✓ Top-up request for ${aed(n)} submitted. Transfer the funds and we'll credit your wallet on confirmation.`); setReference(""); load(); }
      else setMsg(d.error || "Could not submit request.");
    } catch { setMsg("Network error — please try again."); } finally { setBusy(false); }
  }

  const card: React.CSSProperties = { background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 18 };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" };
  const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 13 };

  return (
    <AppShell active="marketplace">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>Credits & Top-up</h1>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 3 }}>Buy marketplace leads with credits. Top up by bank transfer — we confirm and credit your wallet.</div>
        </div>
        <Button onClick={() => (window.location.href = "/marketplace")}>← Marketplace</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ ...card, background: color.brand.primary, color: color.ink.onPrimary, border: 0 }}>
          <div style={{ ...lbl, color: "rgba(255,255,255,0.8)" }}>Available balance</div>
          <div style={{ fontSize: 40, fontWeight: 800, marginTop: 6 }}>{aed(credits)}</div>
          <div style={{ fontSize: 13, marginTop: 6, color: "rgba(255,255,255,0.85)" }}>Credits never expire and apply to every marketplace purchase.</div>
        </div>

        <div style={card}>
          <div style={lbl}>Request a top-up</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {[1000, 2500, 5000, 10000].map((v) => (
              <button key={v} onClick={() => setAmount(String(v))} style={{ height: 32, padding: "0 12px", borderRadius: 8, border: `1px solid ${Number(amount) === v ? color.brand.primary : color.line.strong}`, background: Number(amount) === v ? color.brand.primaryTint : color.surface.card, color: Number(amount) === v ? color.brand.primary : color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{aed(v)}</button>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={lbl}>Amount (AED)</span>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", marginTop: 4 }} />
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={lbl}>Transfer reference (optional)</span>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. your company name on the transfer" style={{ width: "100%", marginTop: 4 }} />
          </div>
          <button onClick={request} disabled={busy} style={{ marginTop: 12, width: "100%", height: 40, borderRadius: 9, border: 0, background: busy ? color.line.strong : color.brand.primary, color: color.ink.onPrimary, fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>{busy ? "Submitting…" : "Submit top-up request"}</button>
          {msg ? <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: msg.startsWith("✓") ? color.status.positive : color.status.negative }}>{msg}</div> : null}
        </div>
      </div>

      {bank ? (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={lbl}>Bank transfer details</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 12 }}>
            {[["Bank", bank.bankName], ["Account name", bank.accountName], ["IBAN", bank.iban], ["SWIFT", bank.swift], ["Currency", bank.currency], ["Minimum", aed(bank.minAmount)]].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 11, color: color.ink.soft }}>{k}</div><div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, fontFamily: k === "IBAN" || k === "SWIFT" ? "monospace" : undefined }}>{v}</div></div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
        <div style={card}>
          <div style={lbl}>Top-up requests</div>
          <div style={{ marginTop: 8 }}>
            {topups.length === 0 ? <div style={{ fontSize: 13, color: color.ink.soft, padding: "10px 0" }}>No requests yet.</div> :
              topups.map((t) => (
                <div key={t.id} style={row}>
                  <span><span style={{ fontWeight: 700, color: color.ink.DEFAULT }}>{aed(t.amount)}</span> <span style={{ color: color.ink.soft, fontSize: 12 }}>· {fmt(t.createdAt)}</span></span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_TONE[String(t.status).toUpperCase()] || color.ink.soft }}>{String(t.status).toUpperCase()}</span>
                </div>
              ))}
          </div>
        </div>

        <div style={card}>
          <div style={lbl}>Transaction history</div>
          <div style={{ marginTop: 8, maxHeight: 360, overflowY: "auto" }}>
            {txns.length === 0 ? <div style={{ fontSize: 13, color: color.ink.soft, padding: "10px 0" }}>No transactions yet.</div> :
              txns.map((t) => (
                <div key={t.id} style={row}>
                  <span style={{ maxWidth: "60%" }}><span style={{ color: color.ink.DEFAULT }}>{t.description || t.type}</span><br /><span style={{ color: color.ink.soft, fontSize: 12 }}>{fmt(t.createdAt)}</span></span>
                  <span style={{ fontWeight: 700, color: Number(t.amount) < 0 ? color.status.negative : color.status.positive }}>{Number(t.amount) < 0 ? "" : "+"}{aed(t.amount)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
