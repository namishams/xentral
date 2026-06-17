import * as React from "react";
import { currentScope } from "@xentral/kernel";
import { loadMarketLeads } from "@xentral/module-marketplace";
import { MarketplaceClient } from "./market-client";

// Server-rendered: real Mediflow marketplace listings via the DataPort when a
// tenant scope is present (live behind auth); safe seed on the public preview.
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const rows = await loadMarketLeads(await currentScope());
  return <MarketplaceClient initialRows={rows} />;
}
