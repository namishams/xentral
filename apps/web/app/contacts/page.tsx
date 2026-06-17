import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { loadContacts } from "@xentral/module-crm";
import { ContactsTable } from "./contacts-table";

// Server-rendered per request: when a live DataSource + auth are wired, this is
// where the tenant scope is passed. On the public preview no source is
// registered, so loadContacts() returns the safe seed directory (no PII).
export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const rows = await loadContacts(/* live host: loadContacts({ companyId }) */);

  return (
    <AppShell active="contacts">
      <PageTitleRow title="Contacts" subtitle={`${rows.length} people`} actions={<Button variant="primary">+ New contact</Button>} />
      <ContactsTable rows={rows} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>
        Loaded via @xentral/module-crm · DataPort (seed on preview · live behind auth)
      </p>
    </AppShell>
  );
}
