import "server-only";
import { NextResponse } from "next/server";
import { logSafetyEvent, type SafetyEvent, type SafetyLevel } from "../../../../lib/safety-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENTS = ["deploy", "health", "module_load", "rollback", "env"];
const LEVELS = ["info", "warn", "error"];

/** POST /api/safety/log — module error boundaries & client error pages report here. */
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const type = (EVENTS.includes(String(b.type)) ? b.type : "module_load") as SafetyEvent;
  const level = (LEVELS.includes(String(b.level)) ? b.level : "error") as SafetyLevel;
  const message = String(b.message ?? "Unhandled module error").slice(0, 500);
  const meta = (b.meta && typeof b.meta === "object" ? b.meta : { name: b.name }) as Record<string, unknown>;
  logSafetyEvent(type, level, message, meta);
  return NextResponse.json({ ok: true });
}
