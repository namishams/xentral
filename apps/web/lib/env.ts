import "server-only";

/**
 * Environment validation. The platform never crashes because of a missing env:
 * required vars gate the whole app; optional module vars only disable their own
 * module. Read at boot (instrumentation) and by /api/health.
 */

export type ModuleKey = "email" | "ai" | "payment" | "whatsapp" | "storage";

const REQUIRED = ["DATABASE_URL", "XENTRAL_SESSION_SECRET"] as const;

/** Optional module → env vars that must ALL be present for the module to run.
 *  Empty list = no global env gate (checked at runtime instead). */
const MODULE_ENV: Record<ModuleKey, string[]> = {
  email: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
  ai: ["OPENAI_API_KEY"],
  whatsapp: ["WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET"],
  payment: [],
  storage: [],
};

const present = (k: string): boolean => {
  const v = process.env[k];
  return typeof v === "string" && v.trim() !== "";
};

export type EnvReport = {
  ok: boolean;
  missingRequired: string[];
  modules: Record<ModuleKey, { configured: boolean; missing: string[] }>;
};

export function checkEnv(): EnvReport {
  const missingRequired = REQUIRED.filter((k) => !present(k));
  const modules = {} as EnvReport["modules"];
  (Object.keys(MODULE_ENV) as ModuleKey[]).forEach((m) => {
    const need = MODULE_ENV[m];
    const missing = need.filter((k) => !present(k));
    modules[m] = { configured: missing.length === 0, missing };
  });
  return { ok: missingRequired.length === 0, missingRequired, modules };
}

/** True if a module's required env is satisfied (so it may run). */
export function moduleEnvReady(m: ModuleKey): boolean {
  const need = MODULE_ENV[m];
  return need.every(present);
}
