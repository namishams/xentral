import * as React from "react";
import { color } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { NewCrmButton } from "../../components/crm-quick-create";
import { loadCompanies } from "@xentral/module-crm";
import { CompaniesTable } from "./companies-table";

// Server-rendered per request. currentScope() resolves the authenticated tenant
// via the kernel SessionPort; on the public preview no resolver is registered,
// so the scope is undefined and loadCompanies returns the safe seed list.
export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const rows = await loadCompanies(await currentScope());

  return (
    <AppShell active="companies">
      <PageTitleRow title="Companies" subtitle={`${rows.length} accounts`} actions={<NewCrmButton entity="company" label="+ New company" />} />
      <CompaniesTable rows={rows} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>
        Loaded via @xentral/module-crm · DataPort (seed on preview · live behind auth)
      </p>
    </AppShell>
  );
}
