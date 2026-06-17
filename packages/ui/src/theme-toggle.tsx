"use client";

import * as React from "react";
import { color } from "@xentral/config";

/** ThemeToggle — locked. Flips document[data-theme] and persists to localStorage. */
export function ThemeToggle() {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    try { setDark(document.documentElement.getAttribute("data-theme") === "dark"); } catch {}
  }, []);
  const toggle = () => {
    const next = !dark; setDark(next);
    try {
      if (next) { document.documentElement.setAttribute("data-theme", "dark"); localStorage.setItem("xentral-theme", "dark"); }
      else { document.documentElement.removeAttribute("data-theme"); localStorage.setItem("xentral-theme", "light"); }
    } catch {}
  };
  return (
    <button onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode"
      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {dark ? "\u2600" : "\u263e"}
    </button>
  );
}
