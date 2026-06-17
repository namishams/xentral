"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StagePill, StatusBadge } from "@xentral/ui";
import { listCompanies, listContacts, listDeals } from "@xentral/module-crm";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

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
      <span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT }}>{children}</span>
    </div>
  );
}

export default function CompanyRecordPage({ params }: { params: { id: string } }) {
  const companies = listCompanies();
  const a = companies.find((x) => x.id === params.id) ?? companies[0];
  if (!a) return <AppShell active="companies"><p style={{ fontSize: 13, color: color.ink.soft }}>Company not found.</p></AppShell>;
  const people = listContacts().filter((c) => c.company === a.name);
  const deals = listDeals().filter((d) => d.account === a.name);
  const pipeline = deals.reduce((s, d) => s + d.value, 0);

  return (
    <AppShell active="companies">
      <a href="/companies" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Companies</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: 11, background: color.surface.sunken, color: color.ink.mid, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(a.name)}</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{a.name}</h1>
            <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{a.industry} · {a.city} · owner {a.owner}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Edit</Button>
          <Button>+ Contact</Button>
          <Button>+ Quote</Button>
          <Button variant="primary">+ New deal</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Open deals" value={String(a.openDeals)} note="in pipeline" noteTone={color.ink.soft} />
        <KPICard label="Pipeline value" value={aed(pipeline)} note="linked deals" noteTone={color.ink.soft} />
        <KPICard label="Contacts" value={String(people.length)} note="at this company" noteTone={color.ink.soft} />
        <KPICard label="Owner" value={a.owner} note="account executive" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Deals" action={<Button>+ New deal</Button>}>
            {deals.length === 0 ? <div style={{ fontSize: 12.5, color: color.ink.soft }}>No deals yet.</div> :
              deals.map((d) => (
                <a key={d.id} href={`/deals/${d.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${color.line.DEFAULT}`, textDecoration: "none" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT }}>{d.name}</span><StagePill stage={d.stage} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{aed(d.value)}</span>
                </a>
              ))}
          </Panel>
          <Panel title="Contacts">
            {people.length === 0 ? <div style={{ fontSize: 12.5, color: color.ink.soft }}>No contacts yet.</div> :
              people.map((c) => (
                <a key={c.id} href={`/contacts/${c.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${color.line.DEFAULT}`, textDecoration: "none" }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(c.name)}</span>
                  <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT }}>{c.name}</span><span style={{ display: "block", fontSize: 12, color: color.ink.soft }}>{c.title}</span></span>
                  <span style={{ fontSize: 12, color: color.ink.soft }}>{c.email}</span>
                </a>
              ))}
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="Industry">{a.industry}</SumRow>
            <SumRow label="City">{a.city}</SumRow>
            <SumRow label="Open deals">{a.openDeals}</SumRow>
            <SumRow label="Owner">{a.owner}</SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — trade licence, contracts.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (company) · locked AppShell + KPICard + StagePill + Button · tokens only</p>
    </AppShell>
  );
}
