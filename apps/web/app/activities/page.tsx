import * as React from "react";
import { color } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { loadActivities } from "@xentral/module-crm";
import { ActivitiesTable } from "./activities-table";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const rows = await loadActivities(await currentScope());

  return (
    <AppShell active="activities">
      <PageTitleRow title="Activities" subtitle={`${rows.length} timeline events`} actions={<Button variant="primary">+ Log activity</Button>} />
      <ActivitiesTable rows={rows} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>
        Loaded via @xentral/module-crm · DataPort (seed on preview · live behind auth)
      </p>
    </AppShell>
  );
}
