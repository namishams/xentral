import * as React from "react";
import { color } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { loadUsers } from "@xentral/module-platform";
import { UsersTable } from "./users-table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const rows = await loadUsers(await currentScope());
  const active = rows.filter((r) => r.active).length;

  return (
    <AppShell active="users">
      <PageTitleRow title="Users & Roles" subtitle={`${active} active · ${rows.length} members`} actions={<Button variant="primary">+ Invite member</Button>} />
      <UsersTable rows={rows} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>
        Loaded via @xentral/module-platform · DataPort (seed on preview · live behind auth)
      </p>
    </AppShell>
  );
}
