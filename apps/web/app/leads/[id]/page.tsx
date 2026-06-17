"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StagePill, StatusBadge } from "@xentral/ui";
import { listLeads } from "@xentral/module-crm";

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

type Tl = { id: string; who: string; kind: "note" | "call" | "email" | "score"; text: string; when: string };
const TIMELINE: Tl[] = [
  { id: "t1", who: "✦ AI", kind: "score", text: "Lead scored — strong intent signals from WhatsApp reply", when: "Today 08:12" },
  { id: "t2", who: "Nami", kind: "call", text: "Quick qualification call — budget confirmed, timeline Q3", when: "Today 10:40" },
  { id: "t3", who: "Sara", kind: "note", text: "Wants a fixed-price proposal before committing.", when: "Yesterday" },
];
const KIND_TONE: Record<Tl["kind"], string> = { note: color.ink.soft, call: color.status.critical, email: color.status.info, score: color.brand.primary };

function scoreTone(s: number): string { return s >= 70 ? color.status.positive : s >= 40 ? color.status.critical : color.status.negative; }

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>{action}
      </div>
      {children}
    </section>
  );
}
function SumRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ fontSize: 13, color: color.ink.soft }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT }}>{children}</span>
    </div>
  );
}

export default function LeadRecordPage({ params }: { params: { id: string } }) {
  const leads = listLeads();
  const l = leads.find((x) => x.id === params.id) ?? leads[0];
  if (!l) return <AppShell active="leads"><p style={{ fontSize: 13, color: color.ink.soft }}>Lead not found.</p></AppShell>;
  const tone = scoreTone(l.score);

  return (
    <AppShell active="leads">
      <a href="/leads" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Leads</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(l.name)}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{l.name}</h1>
              <StagePill stage={l.stage} />
            </div>
            <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{l.company} · via {l.source} · owner {l.owner}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Edit</Button>
          <Button>Call</Button>
          <Button>Email</Button>
          <Button>Disqualify</Button>
          <Button variant="primary">Convert to deal</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Lead score" value={`${l.score}/100`} note={l.score >= 70 ? "hot" : l.score >= 40 ? "warm" : "cold"} noteTone={tone} />
        <KPICard label="Stage" value={l.stage.charAt(0).toUpperCase() + l.stage.slice(1)} note="lead lifecycle" noteTone={color.ink.soft} />
        <KPICard label="Source" value={l.source} note="channel" noteTone={color.ink.soft} />
        <KPICard label="Owner" value={l.owner} note="account executive" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Qualification">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span style={{ flex: 1, height: 8, borderRadius: 4, background: color.surface.sunken, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${l.score}%`, background: tone }} /></span>
              <span style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, width: 52, textAlign: "right" }}>{l.score}/100</span>
            </div>
            <div style={{ fontSize: 12.5, color: color.ink.soft }}>AI-assisted score from engagement, fit and channel. Convert to a deal when qualified.</div>
          </Panel>
          <Panel title="Activity &amp; notes" action={<Button>+ Note</Button>}>
            <div style={{ position: "relative", paddingLeft: 18 }}>
              <span style={{ position: "absolute", left: 4, top: 4, bottom: 4, width: 2, background: color.line.DEFAULT }} />
              {TIMELINE.map((e) => (
                <div key={e.id} style={{ position: "relative", paddingBottom: 16 }}>
                  <span style={{ position: "absolute", left: -18, top: 3, width: 10, height: 10, borderRadius: "50%", background: KIND_TONE[e.kind], border: "2px solid #fff", boxShadow: `0 0 0 1px ${color.line.DEFAULT}` }} />
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{e.who}</span>
                    <span style={{ fontSize: 11, color: color.ink.soft }}>{e.when}</span>
                    <StatusBadge tone="neutral" label={e.kind} />
                  </div>
                  <div style={{ fontSize: 13.5, color: color.ink.mid, marginTop: 2 }}>{e.text}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="Company">{l.company}</SumRow>
            <SumRow label="Source">{l.source}</SumRow>
            <SumRow label="Stage"><StagePill stage={l.stage} /></SumRow>
            <SumRow label="Owner">{l.owner}</SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — enquiry, brief.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (lead) · locked AppShell + KPICard + StagePill + Button · tokens only</p>
    </AppShell>
  );
}
