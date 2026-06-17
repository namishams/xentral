import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { loadCompanies } from "@xentral/module-crm";
import { CompaniesTable } from "./companies-table";

// Server-rendered per request. Tenant scope is passed here once auth lands; on
// the public preview no DataSource is registered, so the safe seed list is used.
export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const rows = await loadCompanies(/* live host: loadCompanies({ companyId }) */);

  return (
    <AppShell active="companies">
      <PageTitleRow title="Companies" subtitle={`${rows.length} accounts`} actions={<Button variant="primary">+ New company</Button>} />
      <CompaniesTable rows={rows} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>
        Loaded via @xentral/module-crm · DataPort (seed on preview · live behind auth)
      </p>
    </AppShell>
  );
}
