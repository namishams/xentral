// Runs once at server boot (node runtime). Registers the SessionPort resolver
// and validates the environment so the app degrades gracefully instead of
// crashing when config is missing. Every problem is logged to the safety log.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/session");
    const { checkEnv } = await import("./lib/env");
    const { logSafetyEvent } = await import("./lib/safety-log");
    const r = checkEnv();
    if (!r.ok) {
      logSafetyEvent("env", "error", "Missing REQUIRED environment variables — app will run degraded", { missing: r.missingRequired });
    }
    (Object.keys(r.modules) as (keyof typeof r.modules)[]).forEach((m) => {
      const info = r.modules[m];
      if (info.missing.length) logSafetyEvent("env", "warn", `Module '${String(m)}' disabled — missing env`, { missing: info.missing });
    });
    logSafetyEvent("env", r.ok ? "info" : "error", "Boot environment validated", { ok: r.ok, build: process.env.XENTRAL_BUILD_REF || null });
  }
}
