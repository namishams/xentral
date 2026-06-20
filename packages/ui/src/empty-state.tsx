import * as React from "react";
import { color } from "@xentral/config";

/** EmptyState — locked empty placeholder. Title + hint + optional action. */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.mid }}>{title}</div>
      {hint && <div style={{ fontSize: 13, color: color.ink.soft, marginTop: 4 }}>{hint}</div>}
      {action && <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>{action}</div>}
    </div>
  );
}
