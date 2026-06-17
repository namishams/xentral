import * as React from "react";
import { color } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge, Panel, PanelHeader, PanelBody, FactStrip } from "@xentral/ui";
import { loadContacts } from "@xentral/module-crm";

export const dynamic = "force-dynamic";

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default async function ContactRecordPage({ params }: { params: { id: string } }) {
  const rows = await loadContacts(await currentScope());
  const c = rows.find((x) => x.id === params.id);
  if (!c) {
    return (
      <AppShell active="contacts">
        <PageTitleRow title="Contact" breadcrumb="CRM · Contacts" />
        <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Contact not found. <a href="/contacts" style={{ color: color.brand.primary }}>Back to contacts</a></div>
      </AppShell>
    );
  }

  const empty = (label: string) => (
    <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>{label}</div>
  );

  return (
    <AppShell active="contacts">
      <PageTitleRow title={c.name} breadcrumb="CRM · Contacts"
        badge={c.owner ? <StatusBadge tone="info" label={c.owner} /> : null}
        actions={<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {c.email ? <a href={`mailto:${c.email}`} style={{ textDecoration: "none" }}><Button>Email</Button></a> : null}
          {c.phone ? <a href={`tel:${c.phone}`} style={{ textDecoration: "none" }}><Button>Call</Button></a> : null}
          <Button variant="primary">+ New deal</Button>
        </div>} />

      {/* Fiori object-page header band */}
      <Panel style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, padding: "18px 20px", borderBottom: `1px solid ${color.line.DEFAULT}`, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
            <span style={{ width: 52, height: 52, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 19, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(c.name)}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: color.ink.DEFAULT }}>{c.name}</div>
              <div style={{ fontSize: 12.5, color: color.ink.mid }}>{[c.title, c.company].filter(Boolean).join(" · ") || "—"}</div>
            </div>
          </div>
        </div>
        <PanelBody>
          <FactStrip facts={[
            { label: "Company", value: c.company || "—" },
            { label: "Owner", value: c.owner || "Unassigned" },
            { label: "Email", value: c.email || "—" },
            { label: "Phone", value: c.phone || "—" },
          ]} />
        </PanelBody>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Activity & notes" actions={<Button>+ Note</Button>} />
            <PanelBody>{empty("No activity logged yet for this contact.")}</PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Linked deals" />
            <PanelBody>{empty("No deals linked yet.")}</PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Documents" subtitle="Quotes & invoices" />
            <PanelBody>{empty("No documents linked to this contact yet.")}</PanelBody>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Details" />
            <PanelBody>
              <Row k="Email" v={c.email ? <a href={`mailto:${c.email}`} style={{ color: color.brand.primary, textDecoration: "none" }}>{c.email}</a> : "—"} />
              <Row k="Phone" v={c.phone || "—"} />
              <Row k="Company" v={c.company || "—"} />
              <Row k="Title" v={c.title || "—"} />
              <Row k="Owner" v={c.owner ? <StatusBadge tone="info" label={c.owner} /> : "Unassigned"} />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Attachments" actions={<Button>Upload</Button>} />
            <PanelBody>{empty("No files yet.")}</PanelBody>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "7px 0", borderBottom: `1px solid ${color.line.DEFAULT}` }}><span style={{ fontSize: 13, color: color.ink.soft }}>{k}</span><span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT, textAlign: "right", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span></div>;
}
