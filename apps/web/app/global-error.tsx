"use client";

/** Root error boundary — the last line of defence. If the root layout itself
 * throws, the user still sees a calm page instead of a raw 500. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f5f6f7", color: "#1d2d3e", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 32, maxWidth: 420 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#e8f1ff", color: "#0064d9", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Something went wrong</h1>
          <p style={{ fontSize: 13, color: "#556b82", margin: "0 0 18px" }}>We hit an unexpected error. Your data is safe — please try again.</p>
          <button onClick={() => reset()} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: 0, background: "#0064d9", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Reload</button>
        </div>
      </body>
    </html>
  );
}
