import * as React from "react";
import { color } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, PageTitleRow, ExportMenu, Button } from "@xentral/ui";
import { NewCrmButton } from "../../components/crm-quick-create";
import { loadContacts } from "@xentral/module-crm";
import { ContactsTable } from "./contacts-table";

// Server-rendered per request. currentScope() resolves the authenticated tenant
// via the kernel SessionPort; on the public preview no resolver is registered,
// so the scope is undefined and loadContacts returns the safe seed list.
export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const rows = await loadContacts(await currentScope());

  return (
    <AppShell active="contacts">
      <PageTitleRow title="Contacts" subtitle={`${rows.length} people`} actions={<><ExportMenu entity="contacts" /><NewCrmButton entity="contact" label="+ New contact" /></>} />
      <ContactsTable rows={rows} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>
        Loaded via @xentral/module-crm · DataPort (seed on preview · live behind auth)
      </p>
    </AppShell>
  );
}
