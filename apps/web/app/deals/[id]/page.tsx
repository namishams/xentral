"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StagePill, StatusBadge } from "@xentral/ui";
import { listDeals } from "@xentral/module-crm";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const initials = (name: string) => name === "Nami" ? "N" : name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const PROB: Record<string, number> = { new: 10, qualified: 30, proposal: 55, won: 100, lost: 0 };

type Tl = { id: string; who: string; kind: "note" | "call" | "email" | "stage" | "task"; text: string; when: string };
const TIMELINE: Tl[] = [
  { id: "t1", who: "Nami", kind: "stage", text: "Moved deal to Proposal", when: "Today 09:40" },
  { id: "t2", who: "Sara", kind: "call", text: "Discovery call — confirmed budget and timeline", when: "Yesterday" },
  { id: "t3", who: "Nami", kind: "email", text: "Sent capability deck and references", when: "Mon" },
  { id: "t4", who: "Sara", kind: "note", text: "Decision maker is the FM director; procurement signs off > AED 250k.", when: "Mon" },
];
const KIND_TONE: Record<Tl["kind"], string> = { note: color.ink.soft, call: color.status.critical, email: color.status.info, stage: color.brand.primary, task: color.status.positive };

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function SumRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ fontSize: 13, color: color.ink.soft }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT }}>{children}</span>
    </div>
  );
}

export default function DealRecordPage({ params }: { params: { id: string } }) {
  const deals = listDeals();
  const deal = deals.find((d) => d.id === params.id) ?? deals[0];
  if (!deal) return <AppShell active="deals"><p style={{ fontSize: 13, color: color.ink.soft }}>Deal not found.</p></AppShell>;
  const prob = PROB[deal.stage] ?? 0;

  return (
    <AppShell active="deals">
      <a href="/deals" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Deals</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{deal.name}</h1>
            <StagePill stage={deal.stage} />
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{deal.account} · owner {deal.owner} · {aed(deal.value)}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Edit</Button>
          <Button>Log activity</Button>
          <Button>New task</Button>
          <Button>Convert to quote</Button>
          <Button variant="primary">Mark won</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Deal value" value={aed(deal.value)} note={deal.currency} />
        <KPICard label="Stage" value={deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)} note={`${prob}% win probability`} noteTone={color.ink.soft} />
        <KPICard label="Weighted" value={aed(Math.round(deal.value * prob / 100))} note="value × probability" noteTone={color.ink.soft} />
        <KPICard label="Owner" value={deal.owner} note="account executive" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Activity & notes" action={<Button>+ Note</Button>}>
            <div style={{ position: "relative", paddingLeft: 18 }}>
              <span style={{ position: "absolute", left: 4, top: 4, bottom: 4, width: 2, background: color.line.DEFAULT }} />
              {TIMELINE.map((e) => (
                <div key={e.id} style={{ position: "relative", paddingBottom: 16 }}>
                  <span style={{ position: "absolute", left: -18, top: 3, width: 10, height: 10, borderRadius: "50%", background: KIND_TONE[e.kind], border: `2px solid #fff`, boxShadow: `0 0 0 1px ${color.line.DEFAULT}` }} />
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{e.who}</span>
                    <span style={{ fontSize: 11, color: color.ink.soft }}>{e.when}</span>
                    <StatusBadge tone="neutral" label={e.kind} />
                  </div>
                  <div style={{ fontSize: 13.5, color: color.ink.mid, marginTop: 2 }}>{e.text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <div style={{ flex: 1, height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 9, display: "flex", alignItems: "center", padding: "0 13px", color: color.ink.soft, fontSize: 13 }}>Add an internal note…</div>
              <Button variant="primary">Add note</Button>
            </div>
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Summary">
            <SumRow label="Account">{deal.account}</SumRow>
            <SumRow label="Owner">{deal.owner}</SumRow>
            <SumRow label="Value">{aed(deal.value)}</SumRow>
            <SumRow label="Stage"><StagePill stage={deal.stage} /></SumRow>
            <SumRow label="Probability">{prob}%</SumRow>
          </Panel>
          <Panel title="Linked records">
            <SumRow label="Quotation">Q-3009</SumRow>
            <SumRow label="Invoice">—</SumRow>
            <SumRow label="Contact"><a href="/contacts" style={{ color: color.brand.primary, textDecoration: "none" }}>View contact ↗</a></SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — proposals, drawings, BOQs.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (deal) · locked AppShell + KPICard + StagePill + Button · tokens only</p>
    </AppShell>
  );
}
