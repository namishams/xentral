import "server-only";
import "../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { accessSync, constants } from "fs";
import { join } from "path";
import { checkEnv } from "../../../lib/env";
import { featureSnapshot } from "../../../lib/flags";
import { logSafetyEvent } from "../../../lib/safety-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 2 }) : new Pool({ connectionString: url, max: 2 });
  return _pool;
}

type Status = "pass" | "warn" | "fail";
type Check = { name: string; status: Status; detail?: string };

/** GET /api/health — single source of truth for "is Xentral healthy?".
 * Used by the deploy smoke gate and the post-deploy auto-rollback guard.
 * 200 = healthy/degraded, 503 = unhealthy (a required dependency is down). */
export async function GET() {
  const checks: Check[] = [{ name: "app", status: "pass" }];

  const env = checkEnv();
  checks.push({ name: "env", status: env.ok ? "pass" : "fail", detail: env.ok ? undefined : `missing ${env.missingRequired.join(", ")}` });
  checks.push({ name: "auth", status: process.env.XENTRAL_SESSION_SECRET ? "pass" : "fail", detail: process.env.XENTRAL_SESSION_SECRET ? undefined : "XENTRAL_SESSION_SECRET not set" });

  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) {
    checks.push({ name: "database", status: "warn", detail: "live data disabled" });
  } else {
    try { await pool(url).query("select 1"); checks.push({ name: "database", status: "pass" }); }
    catch (e) { checks.push({ name: "database", status: "fail", detail: (e as Error).message }); }
  }

  try {
    const dir = process.env.UPLOAD_DIR || join(process.cwd(), "..", "..", "uploads");
    accessSync(dir, constants.W_OK);
    checks.push({ name: "storage", status: "pass" });
  } catch { checks.push({ name: "storage", status: "warn", detail: "upload dir not writable" }); }

  const flags = featureSnapshot();
  const flag = (k: string) => flags.find((f) => f.key === k)?.enabled ?? false;
  checks.push({ name: "payment", status: flag("payment") ? "pass" : "warn", detail: flag("payment") ? undefined : "disabled" });
  checks.push({ name: "whatsapp", status: flag("whatsapp") ? "pass" : "warn", detail: flag("whatsapp") ? undefined : "disabled" });

  const failed = checks.filter((c) => c.status === "fail");
  const status = failed.length ? "unhealthy" : checks.some((c) => c.status === "warn") ? "degraded" : "healthy";
  if (failed.length) logSafetyEvent("health", "error", "Health check UNHEALTHY", { failed: failed.map((f) => `${f.name}: ${f.detail ?? ""}` ) });

  return NextResponse.json(
    { status, version: process.env.XENTRAL_BUILD_REF || null, ts: new Date().toISOString(), checks, features: flags },
    { status: failed.length ? 503 : 200 },
  );
}
