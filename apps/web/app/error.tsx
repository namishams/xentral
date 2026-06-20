"use client";

import { useEffect } from "react";
import { color } from "@xentral/config";

/** Segment error boundary — any page that throws renders this calm fallback
 * card instead of a full 500. The error is reported to the safety log. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      fetch("/api/safety/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "module_load", level: "error", message: error?.message || "Page error", meta: { digest: error?.digest } }) });
    } catch { /* ignore */ }
  }, [error]);
  return (
    <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 380, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 14, padding: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 6px" }}>Module temporarily unavailable</h2>
        <p style={{ fontSize: 13, color: color.ink.mid, margin: "0 0 18px" }}>This section hit an error. The rest of Xentral is unaffected.</p>
        <button onClick={() => reset()} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Try again</button>
      </div>
    </div>
  );
}
