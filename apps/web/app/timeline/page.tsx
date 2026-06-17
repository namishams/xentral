import * as React from "react";
import { color } from "@xentral/config";
import { currentScope } from "@xentral/kernel";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";
import { loadTimeline } from "@xentral/module-crm";
import { TimelineFeed } from "./timeline-feed";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const events = await loadTimeline(await currentScope());

  return (
    <AppShell active="timeline">
      <PageTitleRow title="Timeline" subtitle={`${events.length} events`} actions={<Button variant="primary">+ Log activity</Button>} />
      <TimelineFeed events={events} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>
        Universal Timeline — composed from activities + tasks via @xentral/module-crm · DataPort
      </p>
    </AppShell>
  );
}
