import * as React from "react";
import { color } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, KPICard, Button, StatusBadge } from "@xentral/ui";
import { loadContacts } from "@xentral/module-crm";

export const dynamic = "force-dynamic";

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
      <span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT, textAlign: "right", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
    </div>
  );
}

export default async function ContactRecordPage({ params }: { params: { id: string } }) {
  const rows = await loadContacts(await currentScope());
  const c = rows.find((x) => x.id === params.id);
  if (!c) {
    return (
      <AppShell active="contacts">
        <a href="/contacts" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Contacts</a>
        <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Contact not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell active="contacts">
      <a href="/contacts" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Contacts</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(c.name)}</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{c.name}</h1>
            <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{[c.title, c.company].filter(Boolean).join(" · ") || "—"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {c.email ? <a href={`mailto:${c.email}`} style={{ textDecoration: "none" }}><Button>Email</Button></a> : null}
          {c.phone ? <a href={`tel:${c.phone}`} style={{ textDecoration: "none" }}><Button>Call</Button></a> : null}
          <Button variant="primary">+ New deal</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Company" value={c.company || "—"} note="account" noteTone={color.ink.soft} />
        <KPICard label="Owner" value={c.owner || "Unassigned"} note="account executive" noteTone={color.ink.soft} />
        <KPICard label="Email" value={c.email ? "On file" : "—"} note={c.email || "no email"} noteTone={color.ink.soft} />
        <KPICard label="Phone" value={c.phone ? "On file" : "—"} note={c.phone || "no phone"} noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Activity & notes" action={<Button>+ Note</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No activity logged yet for this contact.</div>
          </Panel>
          <Panel title="Linked deals">
            <div style={{ fontSize: 12.5, color: color.ink.soft }}>No deals linked yet.</div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="Email">{c.email ? <a href={`mailto:${c.email}`} style={{ color: color.brand.primary, textDecoration: "none" }}>{c.email}</a> : "—"}</SumRow>
            <SumRow label="Phone">{c.phone || "—"}</SumRow>
            <SumRow label="Company">{c.company || "—"}</SumRow>
            <SumRow label="Title">{c.title || "—"}</SumRow>
            <SumRow label="Owner">{c.owner ? <StatusBadge tone="info" label={c.owner} /> : "Unassigned"}</SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Contact record · live via DataPort (real contact by id) · tenant-scoped</p>
    </AppShell>
  );
}
