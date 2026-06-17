import * as React from "react";
import { color } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { loadTasks } from "@xentral/module-crm";
import { TasksTable } from "./tasks-table";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const rows = await loadTasks(await currentScope());
  const open = rows.filter((r) => !r.done).length;

  return (
    <AppShell active="tasks">
      <PageTitleRow title="Tasks" subtitle={`${open} open · ${rows.length} total`} actions={<Button variant="primary">+ New task</Button>} />
      <TasksTable rows={rows} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>
        Loaded via @xentral/module-crm · DataPort (seed on preview · live behind auth)
      </p>
    </AppShell>
  );
}
