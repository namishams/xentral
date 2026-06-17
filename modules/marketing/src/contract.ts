/**
 * @xentral/module-marketing — PUBLIC CONTRACT.
 * The only surface other packages (e.g. apps/web) may import. Internal files
 * stay private. Cross-module access goes through this file, never internals.
 */

export type MarketingHighlight = { id: string; title: string; body: string };

/** Headline value propositions for the marketing surface. Stable, tested shape. */
export function getMarketingHighlights(): MarketingHighlight[] {
  return [
    { id: "uae", title: "Built for the UAE", body: "VAT 5%, Corporate Tax 9%, FTA e-invoicing (PINT-AE) and WPS payroll, out of the box." },
    { id: "ai", title: "AI-native", body: "Every workspace gets an AI command bar and agents that take real actions." },
    { id: "allinone", title: "CRM + ERP + Books", body: "From first lead to cash collected to ledger — one multi-tenant platform." },
  ];
}
