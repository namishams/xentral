import "server-only";
import "../../lib/session"; // side-effect: register SessionPort resolver
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { resolveSession } from "@xentral/kernel";

export const dynamic = "force-dynamic";

/**
 * Platform-operator gate. The Admin Portal is Xentral's cross-tenant control
 * surface — only SUPER_ADMIN operators may enter. Tenant users (e.g. Mediflow)
 * are bounced to their own dashboard. Dormant on the public preview.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (process.env.XENTRAL_LIVE_DATA === "1") {
    const s = await resolveSession();
    if (!s || s.role !== "SUPER_ADMIN") redirect("/dashboard");
  }
  return <>{children}</>;
}
