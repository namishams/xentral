import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

/** Passthrough — the operator gate lives on the (console) group so the
 *  /admin/login page stays reachable when signed out. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
