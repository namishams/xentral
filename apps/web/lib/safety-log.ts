import "server-only";
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

/** Append-only JSON-lines safety log. Records every failed deploy, failed health
 * check, failed module load and rollback. Best-effort: it NEVER throws. */

export type SafetyEvent = "deploy" | "health" | "module_load" | "rollback" | "env";
export type SafetyLevel = "info" | "warn" | "error";

function logDir(): string {
  return process.env.SAFETY_LOG_DIR || join(process.cwd(), "..", "..", "logs");
}

export function logSafetyEvent(type: SafetyEvent, level: SafetyLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = { ts: new Date().toISOString(), type, level, message, ...(meta ? { meta } : {}) };
  const line = JSON.stringify(entry);
  try {
    const dir = logDir();
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, "safety.log"), line + "\n");
  } catch {
    /* never throw from the logger */
  }
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink("[safety]", line);
}
