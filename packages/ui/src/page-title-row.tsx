import * as React from "react";
import { color } from "@xentral/config";

/** PageTitleRow — locked Action-page header: breadcrumb + title (20px) + optional badge + actions. */
export function PageTitleRow({ title, subtitle, breadcrumb, badge, actions }: {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: subtitle || breadcrumb ? "flex-end" : "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        {breadcrumb && <div style={{ fontSize: 11.5, color: color.ink.soft }}>{breadcrumb}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h1 style={{ fontSize: 20, lineHeight: "26px", fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{title}</h1>
          {badge}
        </div>
        {subtitle && <p style={{ fontSize: 12.5, color: color.ink.mid, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
