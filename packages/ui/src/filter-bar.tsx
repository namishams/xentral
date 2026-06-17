import * as React from "react";

/** FilterBar — locked container for list filters (search, chips, actions). */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>{children}</div>
  );
}
