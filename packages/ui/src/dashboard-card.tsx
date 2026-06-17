import * as React from "react";
import { uiConstants, color, radius, shadow } from "@xentral/config";

/**
 * DashboardCard — fixed-size card. Heights/min-widths come from ui-constants.
 * Never auto-expands; overflow content belongs in a drawer/modal/detail page.
 */
export type DashboardCardProps = {
  children: React.ReactNode;
  /** kpi (112h) | medium (180h) | large (280h). Default "medium". */
  size?: "kpi" | "medium" | "large";
  title?: string;
  className?: string;
};

export function DashboardCard({ children, size = "medium", title, className = "" }: DashboardCardProps) {
  const c = uiConstants.card;
  const dims =
    size === "kpi" ? c.kpi : size === "large" ? c.large : c.medium;
  return (
    <section
      className={`flex flex-col overflow-hidden bg-white ${className}`}
      style={{
        height: dims.height,
        minWidth: dims.minWidth,
        maxWidth: "maxWidth" in dims ? (dims as { maxWidth: number }).maxWidth : undefined,
        padding: c.paddingX,
        border: `1px solid ${color.line.DEFAULT}`,
        borderRadius: radius.lg,
        boxShadow: shadow.card,
      }}
    >
      {title && (
        <h3
          className="truncate font-semibold"
          style={{ color: color.ink.DEFAULT, fontSize: 13, marginBottom: 8 }}
        >
          {title}
        </h3>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

export default DashboardCard;
