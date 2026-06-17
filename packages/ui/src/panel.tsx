import * as React from "react";
import { color, shadow, radius } from "@xentral/config";

/**
 * FactStrip — Fiori object-page header facts. A horizontal row of label/value
 * pairs (issue date, due date, totals…) used at the top of record pages.
 */
export function FactStrip({ facts }: { facts: { label: string; value: React.ReactNode; tone?: "default" | "negative" | "positive" }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 40px" }}>
      {facts.map((f, i) => (
        <div key={i} style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 3 }}>{f.label}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: f.tone === "negative" ? color.status.negative : f.tone === "positive" ? color.status.positive : color.ink.DEFAULT }}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * @xentral/ui — Panel (Fiori object card)
 * White surface, 1px border, subtle shadow. The standard container for
 * every content block on a page. Ported 1:1 from the original Xentral app
 * (adapted to the locked token surface — no hardcoded hex). SSR-safe:
 * interactive hover is pure CSS, so Panel works in server components too.
 */
export function Panel({
  className, children, interactive, style,
}: {
  className?: string;
  children: React.ReactNode;
  /** Adds hover elevation for clickable cards */
  interactive?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`xui-panel${interactive ? " xui-panel--i" : ""}${className ? " " + className : ""}`}
      style={{
        background: color.surface.card,
        border: `1px solid ${color.line.DEFAULT}`,
        borderRadius: radius.xl,
        boxShadow: shadow.card,
        ...(interactive ? { cursor: "pointer" } : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title, subtitle, actions, className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 12, padding: "12px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: color.ink.soft, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

export function PanelBody({
  className, children, flush,
}: {
  className?: string;
  children: React.ReactNode;
  /** No padding — for tables and lists that go edge to edge */
  flush?: boolean;
}) {
  return <div className={className} style={{ padding: flush ? 0 : 16 }}>{children}</div>;
}

export function PanelFooter({
  className, children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
        padding: "12px 16px", borderTop: `1px solid ${color.line.DEFAULT}`, background: color.surface.page,
        borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl,
      }}
    >
      {children}
    </div>
  );
}
