import "server-only";
import { moduleEnvReady, type ModuleKey } from "./env";

/**
 * Feature flags. Existing core modules stay on; NEW modules ship OFF by default
 * and must be enabled manually via FLAG_<KEY>=1. A module also auto-disables if
 * its required env is missing — the app degrades, it never crashes.
 */
type Flag = { key: string; label: string; defaultOn: boolean; envModule?: ModuleKey };

export const FLAGS: Flag[] = [
  { key: "email", label: "Email sending", defaultOn: true, envModule: "email" },
  { key: "ai", label: "AI assistant", defaultOn: true, envModule: "ai" },
  { key: "whatsapp", label: "WhatsApp inbox", defaultOn: true, envModule: "whatsapp" },
  { key: "payment", label: "Payments / checkout", defaultOn: true, envModule: "payment" },
  // New / experimental modules — OFF until manually enabled with FLAG_<KEY>=1:
  { key: "cloud_export", label: "Cloud export (Drive/Dropbox/OneDrive)", defaultOn: false },
  { key: "ai_forecasting", label: "AI forecasting", defaultOn: false },
];

function envOverride(key: string): boolean | null {
  const v = process.env[`FLAG_${key.toUpperCase()}`];
  if (v == null) return null;
  const s = v.toLowerCase();
  return s === "1" || s === "true" || s === "on";
}

export function isFeatureEnabled(key: string): boolean {
  const f = FLAGS.find((x) => x.key === key);
  if (!f) return false;                                       // unknown flag → off (safe default)
  if (f.envModule && !moduleEnvReady(f.envModule)) return false; // env missing → disable, don't crash
  const ov = envOverride(key);
  if (ov != null) return ov;                                  // explicit manual control wins
  return f.defaultOn;                                         // new modules default OFF
}

export function featureSnapshot(): { key: string; label: string; enabled: boolean; defaultOn: boolean }[] {
  return FLAGS.map((f) => ({ key: f.key, label: f.label, enabled: isFeatureEnabled(f.key), defaultOn: f.defaultOn }));
}
