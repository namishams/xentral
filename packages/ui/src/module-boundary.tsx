"use client";

import * as React from "react";
import { color } from "@xentral/config";

/** ModuleBoundary — wrap any module's subtree so a crash inside it degrades to a
 * fallback card ("Module temporarily unavailable.") instead of taking down the
 * whole app. Failures are reported to the safety log. */
export class ModuleBoundary extends React.Component<{ name?: string; children: React.ReactNode }, { failed: boolean }> {
  constructor(props: { name?: string; children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  componentDidCatch(error: unknown): void {
    try {
      fetch("/api/safety/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "module_load", level: "error", message: `Module '${this.props.name ?? "unknown"}' crashed`, meta: { error: String(error) } }) });
    } catch { /* ignore */ }
  }
  render(): React.ReactNode {
    if (this.state.failed) {
      return (
        <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "22px 20px", textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: color.surface.sunken, color: color.ink.soft, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>Module temporarily unavailable</div>
          <div style={{ fontSize: 12, color: color.ink.soft, marginTop: 4 }}>The rest of Xentral is working normally.</div>
          <button onClick={() => this.setState({ failed: false })} style={{ marginTop: 14, height: 32, padding: "0 14px", borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.DEFAULT, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
