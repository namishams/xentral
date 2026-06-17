"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StagePill, StatusBadge } from "@xentral/ui";
import { listContacts, listDeals } from "@xentral/module-crm";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

type Tl = { id: string; who: string; kind: "note" | "call" | "email" | "meeting"; text: string; when: string };
const TIMELINE: Tl[] = [
  { id: "t1", who: "Nami", kind: "call", text: "Intro call — mapped current suppliers and pain points", when: "Today 10:10" },
  { id: "t2", who: "Nami", kind: "email", text: "Shared capability deck and UAE references", when: "Yesterday" },
  { id: "t3", who: "Sara", kind: "meeting", text: "Site walkthrough booked for Thursday 15:00", when: "Mon" },
];

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ fontSize: 13, color: color.ink.soft }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT, textAlign: "right", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
    </div>
  );
}
const KIND_TONE: Record<Tl["kind"], string> = { note: color.ink.soft, call: color.status.critical, email: color.status.info, meeting: color.status.positive };

export default function ContactRecordPage({ params }: { params: { id: string } }) {
  const contacts = listContacts();
  const c = contacts.find((x) => x.id === params.id) ?? contacts[0];
  if (!c) return <AppShell active="contacts"><p style={{ fontSize: 13, color: color.ink.soft }}>Contact not found.</p></AppShell>;
  const deals = listDeals().filter((d) => d.account === c.company);
  const pipeline = deals.reduce((s, d) => s + d.value, 0);

  return (
    <AppShell active="contacts">
      <a href="/contacts" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Contacts</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(c.name)}</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{c.name}</h1>
            <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{c.title} · {c.company}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Edit</Button>
          <Button>Email</Button>
          <Button>Call</Button>
          <Button>Log activity</Button>
          <Button variant="primary">+ New deal</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Open deals" value={String(deals.length)} note={c.company} noteTone={color.ink.soft} />
        <KPICard label="Pipeline value" value={aed(pipeline)} note="linked to this contact" noteTone={color.ink.soft} />
        <KPICard label="Last activity" value="Today" note="intro call" noteTone={color.ink.soft} />
        <KPICard label="Owner" value={c.owner} note="account executive" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Activity & notes" action={<Button>+ Note</Button>}>
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
          <Panel title="Linked deals">
            {deals.length === 0 ? <div style={{ fontSize: 12.5, color: color.ink.soft }}>No deals linked yet.</div> :
              deals.map((d) => (
                <a key={d.id} href={`/deals/${d.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${color.line.DEFAULT}`, textDecoration: "none" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT }}>{d.name}</span><StagePill stage={d.stage} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{aed(d.value)}</span>
                </a>
              ))}
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="Email"><a href={`mailto:${c.email}`} style={{ color: color.brand.primary, textDecoration: "none" }}>{c.email}</a></SumRow>
            <SumRow label="Phone">{c.phone}</SumRow>
            <SumRow label="Company">{c.company}</SumRow>
            <SumRow label="Title">{c.title}</SumRow>
            <SumRow label="Owner">{c.owner}</SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — contracts, ID, agreements.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (contact) · locked AppShell + KPICard + StagePill + Button · tokens only</p>
    </AppShell>
  );
}
