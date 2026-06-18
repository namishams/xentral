import "server-only";
import "../../../lib/session"; // side-effect: register SessionPort resolver
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { resolveSession } from "@xentral/kernel";

export const dynamic = "force-dynamic";

/** Operator gate for the console. Non-SUPER_ADMIN visitors are sent to the
 *  dedicated operator login (/admin/login), which is OUTSIDE this group. */
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  if (process.env.XENTRAL_LIVE_DATA === "1") {
    const s = await resolveSession();
    if (!s || s.role !== "SUPER_ADMIN") redirect("/admin/login");
  }
  return <>{children}</>;
}
