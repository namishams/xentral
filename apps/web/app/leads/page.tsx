import * as React from "react";
import { color } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { NewCrmButton } from "../../components/crm-quick-create";
import { loadLeads } from "@xentral/module-crm";
import { LeadsTable } from "./leads-table";

// Server-rendered per request. currentScope() resolves the authenticated tenant
// via the kernel SessionPort; on the public preview no resolver is registered,
// so the scope is undefined and loadLeads returns the safe seed list.
export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const rows = await loadLeads(await currentScope());

  return (
    <AppShell active="leads">
      <PageTitleRow title="Leads" subtitle={`${rows.length} open leads`} actions={<NewCrmButton entity="lead" label="+ New lead" />} />
      <LeadsTable rows={rows} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>
        Loaded via @xentral/module-crm · DataPort (seed on preview · live behind auth)
      </p>
    </AppShell>
  );
}
