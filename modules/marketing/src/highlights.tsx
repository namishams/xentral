import * as React from "react";
import { DashboardCard } from "@xentral/ui";
import { color } from "@xentral/config";
import { getMarketingHighlights } from "./contract";

/** Renders the marketing highlights using only locked @xentral/ui + tokens. */
export function MarketingHighlights() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {getMarketingHighlights().map((h) => (
        <DashboardCard key={h.id} size="medium" title={h.title}>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: color.ink.mid }}>{h.body}</p>
        </DashboardCard>
      ))}
    </div>
  );
}
