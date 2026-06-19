import "server-only";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";

/**
 * Audit trail — best-effort, never throws. Records who did what, when, to which record.
 * Enterprise/compliance: an immutable activity log per workspace.
 */
let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

export type AuditOpts = { targetType?: string; targetId?: string | null; meta?: Record<string, unknown> | null };

/** Record an audit event for the current session. Safe to call without await; failures are swallowed. */
export async function logAudit(action: string, opts: AuditOpts = {}): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return;
  try {
    const session = await resolveSession();
    if (!session) return;
    await pool(url).query(
      `insert into "audit_logs" (id,"companyId","userId",action,"targetType","targetId",meta,"createdAt")
       values ($1,$2,$3,$4,$5,$6,$7,now())`,
      [randomUUID(), session.companyId, session.userId, action,
        opts.targetType ?? null, opts.targetId ?? null,
        opts.meta == null ? null : JSON.stringify(opts.meta)]);
  } catch {
    /* audit must never break the request */
  }
}
