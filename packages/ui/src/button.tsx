import * as React from "react";
import { color } from "@xentral/config";

export type ButtonVariant = "primary" | "secondary" | "ghost";

/** Button — locked. Three variants, fixed 32px height, token-bound. */
export function Button({ children, variant = "secondary", onClick, type = "button", disabled }: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: disabled ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, opacity: disabled ? 0.5 : 1 };
  const v: Record<ButtonVariant, React.CSSProperties> = {
    primary: { ...base, background: color.brand.primary, color: color.ink.onPrimary, border: 0 },
    secondary: { ...base, background: color.surface.card, color: color.ink.DEFAULT, border: `1px solid ${color.line.strong}` },
    ghost: { ...base, background: "transparent", color: color.ink.mid, border: 0 },
  };
  return <button type={type} onClick={onClick} disabled={disabled} style={v[variant]}>{children}</button>;
}
