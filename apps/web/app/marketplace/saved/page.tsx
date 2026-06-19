import * as React from "react";
import { currentScope } from "@xentral/kernel";
import { loadMarketLeads } from "@xentral/module-marketplace";
import { MarketplaceClient } from "../market-client";

// Saved leads — same marketplace surface, opened with the Saved (watchlist) filter on.
export const dynamic = "force-dynamic";

export default async function SavedLeadsPage() {
  const rows = await loadMarketLeads(await currentScope());
  return <MarketplaceClient initialRows={rows} startSaved />;
}
