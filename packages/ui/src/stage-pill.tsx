import * as React from "react";
import { pipeline } from "@xentral/config";

type Stage = keyof typeof pipeline;

/**
 * StagePill — locked pastel pipeline-stage pill (monday.com style). Colours come
 * from `@xentral/config` pipeline tokens, never hardcoded, so every list renders
 * the same stage with the same colour. Text uses the dark shade of its own ramp
 * (AA contrast) — never plain black.
 */
export function StagePill({ stage, label }: { stage: string; label?: string }) {
  const key = (Object.prototype.hasOwnProperty.call(pipeline, stage) ? stage : "new") as Stage;
  const t = pipeline[key];
  return (
    <span style={{ display: "inline-block", fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 8, background: t.bg, color: t.fg, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {label ?? stage}
    </span>
  );
}
