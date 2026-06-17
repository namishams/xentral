import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth gate — DORMANT by default.
 *
 * Runs only when XENTRAL_LIVE_DATA=1 (the same gate that arms live data + the
 * session resolver). Until armed it is a no-op, so the public preview is
 * untouched: every app route renders seed data with no redirect.
 *
 * When armed, any request to a protected app section without a session cookie is
 * redirected to /auth/login?next=<path>. This is a lightweight presence check;
 * the cryptographic verification still happens server-side in the SessionPort
 * resolver (so a forged cookie reaches a page but resolves to no tenant → seed,
 * never another tenant's data). Marketing pages, /auth, /api and static assets
 * stay public via the matcher below.
 */
export function middleware(req: NextRequest) {
  if (process.env.XENTRAL_LIVE_DATA !== "1") return NextResponse.next();
  if (req.cookies.get("xentral_session")?.value) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/auth/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
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
    "/customer-journey/:path*", "/projects/:path*",
  ],
};
