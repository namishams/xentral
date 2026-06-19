"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge, Panel, PanelHeader, PanelBody } from "@xentral/ui";

type Plan = { key: string; name: string; description: string; priceMonthly: number; priceAnnual: number; seatsIncluded: number; aiCredits: number; automationLimit: number; marketplaceAccess: boolean; apiAccess: boolean; storageMb: number };
type Data = {
  currency: string; plan: Plan | null; plans: Plan[];
  subscription: { planKey: string; status: string; billingCycle: string; renewsOn: string | null; trialEnds: string | null };
  usage: { seatsUsed: number; seatsCap: number; aiCreditsBalance: number; aiCreditsIncluded: number; automationsUsed: number; automationsCap: number };
};
const N = (v: unknown) => Number(v) || 0;

export default function BillingPage() {
  const [d, setD] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cycle, setCycle] = React.useState<"monthly" | "annual">("monthly");
  const [busy, setBusy] = React.useState("");
  const [msg, setMsg] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/billing/entitlements").then((r) => r.json()).then((j) => { if (!j.empty && !j.error) { setD(j); setCycle(j.subscription?.billingCycle === "annual" ? "annual" : "monthly"); } setLoading(false); }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const cur = d?.currency || "AED";
  const money = (n: number) => `${cur} ${N(n).toLocaleString()}`;

  async function selectPlan(key: string) {
    if (!d || key === d.subscription.planKey) return;
    if (!confirm(`Switch your workspace to the ${d.plans.find((p) => p.key === key)?.name} plan (${cycle})?`)) return;
    setBusy(key); setMsg("");
    const r = await fetch("/api/billing/entitlements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planKey: key, billingCycle: cycle }) });
    setBusy("");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error || "Could not change plan"); return; }
    setMsg("Plan updated."); load();
  }

  function Bar({ used, cap }: { used: number; cap: number }) {
    const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
    const over = cap > 0 && used > cap;
    return <div style={{ height: 6, background: color.surface.sunken, borderRadius: 3, marginTop: 6 }}><div style={{ height: 6, width: `${pct}%`, background: over ? color.status.critical : color.brand.primary, borderRadius: 3 }} /></div>;
  }

  return (
    <AppShell active="billing">
      <PageTitleRow title="Billing & plans" subtitle="Your subscription, usage and plan options"
        badge={d ? <StatusBadge tone={d.subscription.status === "active" ? "positive" : "warning"} label={d.subscription.status} /> : null} />

      {msg && <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 500, color: color.status.positive, background: "#F0FDF4", border: `1px solid ${color.status.positive}33`, borderRadius: 8, padding: "9px 12px" }}>{msg}</div>}

      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div>
        : !d || !d.plan ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Billing unavailable.</div>
          : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 16 }}>
                <KPICard label="Current plan" value={d.plan.name} note={d.subscription.billingCycle} noteTone={color.brand.primary} />
                <KPICard label="Seats" value={`${d.usage.seatsUsed}/${d.usage.seatsCap}`} note="in use" noteTone={d.usage.seatsUsed > d.usage.seatsCap ? color.status.critical : color.ink.soft} />
                <KPICard label="AI credits" value={N(d.usage.aiCreditsBalance).toLocaleString()} note={`of ${N(d.usage.aiCreditsIncluded).toLocaleString()}/mo`} noteTone={color.status.info} />
                <KPICard label="Renews" value={d.subscription.renewsOn || "—"} note={d.subscription.trialEnds ? `trial ends ${d.subscription.trialEnds}` : "next cycle"} noteTone={color.ink.soft} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginBottom: 18 }}>
                <Panel><PanelHeader title="Usage this period" /><PanelBody>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: color.ink.mid }}>Seats</span><span style={{ color: color.ink.DEFAULT, fontWeight: 600 }}>{d.usage.seatsUsed} / {d.usage.seatsCap}</span></div><Bar used={d.usage.seatsUsed} cap={d.usage.seatsCap} /></div>
                    <div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: color.ink.mid }}>AI credits (balance)</span><span style={{ color: color.ink.DEFAULT, fontWeight: 600 }}>{N(d.usage.aiCreditsBalance).toLocaleString()} / {N(d.usage.aiCreditsIncluded).toLocaleString()}</span></div><Bar used={Math.max(0, d.usage.aiCreditsIncluded - d.usage.aiCreditsBalance)} cap={d.usage.aiCreditsIncluded} /></div>
                    <div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: color.ink.mid }}>Automations</span><span style={{ color: color.ink.DEFAULT, fontWeight: 600 }}>{d.usage.automationsUsed} / {d.usage.automationsCap}</span></div><Bar used={d.usage.automationsUsed} cap={d.usage.automationsCap} /></div>
                  </div>
                </PanelBody></Panel>
                <Panel><PanelHeader title="Plan features" subtitle={d.plan.name} /><PanelBody>
                  <Row k="Seats included" v={String(d.plan.seatsIncluded)} />
                  <Row k="AI credits / month" v={N(d.plan.aiCredits).toLocaleString()} />
                  <Row k="Automations" v={d.plan.automationLimit >= 1000 ? "Unlimited" : String(d.plan.automationLimit)} />
                  <Row k="Storage" v={`${Math.round(N(d.plan.storageMb) / 1024)} GB`} />
                  <Row k="Marketplace" v={d.plan.marketplaceAccess ? "✓" : "—"} />
                  <Row k="API access" v={d.plan.apiAccess ? "✓" : "—"} />
                </PanelBody></Panel>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>Change plan</h2>
                <div style={{ display: "inline-flex", border: `1px solid ${color.line.strong}`, borderRadius: 8, overflow: "hidden" }}>
                  {(["monthly", "annual"] as const).map((c) => <button key={c} onClick={() => setCycle(c)} style={{ padding: "6px 14px", fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer", background: cycle === c ? color.brand.primary : color.surface.card, color: cycle === c ? color.ink.onPrimary : color.ink.mid, textTransform: "capitalize" }}>{c}{c === "annual" ? " (2 mo free)" : ""}</button>)}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
                {d.plans.map((pl) => {
                  const isCurrent = pl.key === d.subscription.planKey;
                  const price = cycle === "annual" ? pl.priceAnnual : pl.priceMonthly;
                  const enterprise = pl.key === "enterprise";
                  return (
                    <div key={pl.key} style={{ border: `${isCurrent ? 2 : 1}px solid ${isCurrent ? color.brand.primary : color.line.DEFAULT}`, borderRadius: 12, padding: "16px 16px", background: color.surface.card, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: color.ink.DEFAULT }}>{pl.name}</span>
                        {isCurrent ? <StatusBadge tone="positive" label="current" /> : null}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: color.ink.DEFAULT }}>{enterprise ? "Custom" : (price === 0 ? "Free" : money(price))}<span style={{ fontSize: 12, fontWeight: 500, color: color.ink.soft }}>{!enterprise && price > 0 ? (cycle === "annual" ? "/yr" : "/mo") : ""}</span></div>
                      <div style={{ fontSize: 12, color: color.ink.mid, lineHeight: 1.5, minHeight: 34 }}>{pl.description || ""}</div>
                      <div style={{ fontSize: 12, color: color.ink.mid, display: "flex", flexDirection: "column", gap: 3 }}>
                        <span>{pl.seatsIncluded} seats</span>
                        <span>{N(pl.aiCredits).toLocaleString()} AI credits/mo</span>
                        <span>{pl.automationLimit >= 1000 ? "Unlimited" : pl.automationLimit} automations</span>
                        <span>{pl.apiAccess ? "✓ API access" : "— No API"}</span>
                      </div>
                      <div style={{ marginTop: "auto" }}>
                        {isCurrent ? <Button>Current plan</Button>
                          : enterprise ? <a href="/request-demo" style={{ textDecoration: "none" }}><Button>Contact sales</Button></a>
                            : <Button variant="primary" onClick={() => selectPlan(pl.key)} disabled={busy === pl.key}>{busy === pl.key ? "…" : "Select"}</Button>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, padding: "10px 14px", background: color.surface.sunken, borderRadius: 10, fontSize: 12.5, color: color.ink.mid }}>
                All subscription and customer payments are processed through <b style={{ color: "#0098a6" }}>Telr</b> — UAE&rsquo;s leading payment gateway. VAT invoices are issued automatically for every charge.
              </div>
            </>
          )}
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: `1px solid ${color.line.DEFAULT}`, color: color.ink.mid }}><span>{k}</span><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{v}</span></div>;
}
