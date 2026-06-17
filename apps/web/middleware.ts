import { NextResponse, type NextRequest } from "next/server";

/**
 * Two jobs:
 *  1. Legacy redirects — the old app used /dashboard/* paths; the new build uses
 *     top-level routes. Old bookmarks/links are 308-redirected to the new path so
 *     nothing dead-ends (accounts→companies, whatsapp→inbox, settings collapse).
 *  2. Auth gate — DORMANT unless XENTRAL_LIVE_DATA=1. When armed, protected app
 *     routes without a session cookie go to /auth/login. Cryptographic check still
 *     happens server-side in the SessionPort (forged cookie → no tenant → seed).
 */

const RENAMES: Record<string, string> = { accounts: "companies", whatsapp: "inbox", overview: "dashboard" };

function legacyTarget(pathname: string): string | null {
  if (!pathname.startsWith("/dashboard/")) return null;
  const rest = pathname.slice("/dashboard".length); // e.g. "/contacts/123"
  const seg = rest.split("/")[1] || "";
  if (seg === "settings") return "/settings";
  if (RENAMES[seg]) return rest.replace("/" + seg, "/" + RENAMES[seg]);
  return rest; // strip the /dashboard prefix → top-level route
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) Legacy /dashboard/* → new top-level paths
  const target = legacyTarget(pathname);
  if (target && target !== pathname) {
    const u = req.nextUrl.clone();
    u.pathname = target;
    return NextResponse.redirect(u, 308);
  }

  // 2) Auth gate (dormant until armed)
  if (process.env.XENTRAL_LIVE_DATA !== "1") return NextResponse.next();
  if (req.cookies.get("xentral_session")?.value) return NextResponse.next();
  const u = req.nextUrl.clone();
  u.pathname = "/auth/login";
  u.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(u);
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/contacts/:path*", "/companies/:path*", "/leads/:path*",
    "/deals/:path*", "/activities/:path*", "/tasks/:path*", "/pipelines/:path*",
    "/invoices/:path*", "/invoice/:path*", "/quotations/:path*", "/receivables/:path*",
    "/products/:path*", "/suppliers/:path*", "/payables/:path*", "/inventory/:path*",
    "/payments/:path*", "/orders/:path*", "/warehouses/:path*", "/ledger/:path*",
    "/banking/:path*", "/price-lists/:path*", "/procurement/:path*", "/commerce/:path*",
    "/categories/:path*", "/admin/:path*", "/roles/:path*", "/users/:path*",
    "/api-keys/:path*", "/audit-logs/:path*", "/automations/:path*", "/org/:path*",
    "/reseller/:path*", "/partner/:path*", "/marketplace/:path*", "/people/:path*",
    "/sales-teams/:path*", "/sales-performance/:path*", "/forecasting/:path*",
    "/reports/:path*", "/calendar/:path*", "/meetings/:path*", "/email/:path*",
    "/inbox/:path*", "/chat/:path*", "/calls/:path*", "/campaigns/:path*",
    "/documents/:path*", "/developer/:path*", "/payroll/:path*", "/o2c/:path*",
    "/p2p/:path*", "/parties/:path*", "/relationship-intelligence/:path*",
    "/customer-journey/:path*", "/projects/:path*", "/settings/:path*",
  ],
};
