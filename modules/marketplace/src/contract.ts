import { getDataSource, hasDataSource, type TenantScope } from "@xentral/kernel";
export type ListingKind = { id: string; label: string };
export function getListingKinds(): ListingKind[] {
  return [{ id: "lead", label: "Lead" }, { id: "saved-search", label: "Saved search" }];
}

/* ── Lead marketplace (UAE). Dutch-auction style: price drops over time.
 *    Seeded, fully fictional — NEVER real PII on the public preview.
 *    Contact preview is masked; real details only after purchase (DB-backed at go-live). ── */

export type LeadQuality = "hot" | "warm" | "standard";

export type MarketLead = {
  id: string;
  title: string;
  categoryLabel: string;
  category: string;
  region: string;         // line 1 e.g. "UAE", "Unknown"
  city: string;           // line 2 e.g. "Dubai", "Middle East"
  quality: LeadQuality;
  freshLabel: string;     // "Fresh today" | "Today" | "1d ago"
  spots: number;
  views: number;
  price: number;          // current
  basePrice: number;      // original
  dropAmount: number;     // next drop in AED
  dropInLabel: string;    // "3h 51m"
  dropAtLabel: string;    // "10:35 PM"
  maskedName: string;
  maskedPhone: string;
  channels: { phone: boolean; whatsapp: boolean; email: boolean; linkedin: boolean; cv: boolean; dataflow: boolean };
};

export function getMarketCategories(): { id: string; label: string }[] {
  return [
    { id: "all", label: "All Categories" },
    { id: "healthcare", label: "Healthcare" },
    { id: "real-estate", label: "Real estate" },
    { id: "construction", label: "Construction" },
    { id: "retail", label: "Retail & e-commerce" },
    { id: "logistics", label: "Logistics" },
    { id: "professional", label: "Professional services" },
  ];
}

export function listMarketLeads(): MarketLead[] {
  return [
    { id: "m1", title: "Healthcare Professional", categoryLabel: "HEALTHCARE", category: "healthcare", region: "Unknown", city: "Middle East", quality: "standard", freshLabel: "Fresh today", spots: 3, views: 7, price: 40, basePrice: 60, dropAmount: 6, dropInLabel: "3h 51m", dropAtLabel: "10:35 PM", maskedName: "N** B***", maskedPhone: "40975 *** **** **05", channels: { phone: true, whatsapp: false, email: true, linkedin: false, cv: false, dataflow: false } },
    { id: "m2", title: "General", categoryLabel: "Healthcare", category: "healthcare", region: "UAE", city: "Dubai", quality: "warm", freshLabel: "Today", spots: 3, views: 10, price: 120, basePrice: 150, dropAmount: 10, dropInLabel: "4h 32m", dropAtLabel: "11:16 PM", maskedName: "S**", maskedPhone: "44789 *** **** **10", channels: { phone: true, whatsapp: true, email: false, linkedin: false, cv: false, dataflow: false } },
    { id: "m3", title: "General", categoryLabel: "Healthcare", category: "healthcare", region: "UAE", city: "Dubai", quality: "warm", freshLabel: "1d ago", spots: 3, views: 26, price: 100, basePrice: 150, dropAmount: 10, dropInLabel: "3h 23m", dropAtLabel: "10:06 PM", maskedName: "3** ***", maskedPhone: "79111 *** **** **78", channels: { phone: true, whatsapp: true, email: false, linkedin: false, cv: false, dataflow: false } },
    { id: "m4", title: "Real Estate Buyer", categoryLabel: "REAL ESTATE", category: "real-estate", region: "UAE", city: "Dubai", quality: "hot", freshLabel: "Fresh today", spots: 2, views: 18, price: 320, basePrice: 480, dropAmount: 20, dropInLabel: "1h 40m", dropAtLabel: "09:50 PM", maskedName: "A** R***", maskedPhone: "50110 *** **** **00", channels: { phone: true, whatsapp: true, email: true, linkedin: true, cv: false, dataflow: false } },
    { id: "m5", title: "Fit-out Contractor", categoryLabel: "CONSTRUCTION", category: "construction", region: "UAE", city: "Sharjah", quality: "standard", freshLabel: "2d ago", spots: 4, views: 9, price: 90, basePrice: 160, dropAmount: 8, dropInLabel: "5h 02m", dropAtLabel: "11:40 PM", maskedName: "K** M***", maskedPhone: "55778 *** **** **42", channels: { phone: true, whatsapp: false, email: true, linkedin: false, cv: false, dataflow: false } },
    { id: "m6", title: "Logistics Lead", categoryLabel: "LOGISTICS", category: "logistics", region: "GCC", city: "Riyadh", quality: "warm", freshLabel: "1d ago", spots: 3, views: 12, price: 70, basePrice: 120, dropAmount: 6, dropInLabel: "2h 15m", dropAtLabel: "10:20 PM", maskedName: "T** B***", maskedPhone: "52330 *** **** **87", channels: { phone: false, whatsapp: true, email: true, linkedin: true, cv: false, dataflow: false } },
  ];
}


/* ── Live Mediflow lead-sale connector (read side). Maps real marketplace_leads
   through the DataPort, masks PII, applies the dutch-auction price. Seed fallback
   on the public preview (no scope / no source). ── */
function mpCurrentPrice(initial: number, minP: number, decayAmount: number, decayInterval: number, listedAtISO: string): number {
  const hrs = (Date.now() - new Date(listedAtISO).getTime()) / 3600000;
  const drops = Math.floor(hrs / Math.max(1, decayInterval));
  return Math.max(minP, initial - drops * decayAmount);
}
function mpNextDropLabel(decayInterval: number, listedAtISO: string): string {
  const intervalMs = Math.max(1, decayInterval) * 3600000;
  const remain = intervalMs - ((Date.now() - new Date(listedAtISO).getTime()) % intervalMs);
  const m = Math.max(0, Math.floor(remain / 60000));
  const h = Math.floor(m / 60);
  return h > 0 ? (h + "h " + (m % 60) + "m") : (m + "m");
}
function mpDropAtLabel(decayInterval: number, listedAtISO: string): string {
  const intervalMs = Math.max(1, decayInterval) * 3600000;
  const remain = intervalMs - ((Date.now() - new Date(listedAtISO).getTime()) % intervalMs);
  return new Date(Date.now() + remain).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function mpFresh(listedAtISO: string): string {
  const days = Math.floor((Date.now() - new Date(listedAtISO).getTime()) / 86400000);
  return days <= 0 ? "Fresh today" : days === 1 ? "1d ago" : (days + "d ago");
}
function mpMaskName(f?: string, l?: string): string {
  const a = f ? f[0] + "**" : "";
  const b = l ? l[0] + "***" : "";
  return [a, b].filter(Boolean).join(" ") || "Verified lead";
}
function mpMaskPhone(p?: string): string {
  if (!p) return "*** **** ****";
  const digits = p.replace(/\D/g, "");
  return p.slice(0, 5) + " *** **** **" + digits.slice(-2);
}
const MP_Q: Record<string, LeadQuality> = { HOT: "hot", WARM: "warm", STANDARD: "standard" };

/** Load marketplace listings via the DataPort (live, masked); seed fallback on preview. */
export async function loadMarketLeads(scope?: TenantScope): Promise<MarketLead[]> {
  if (scope && hasDataSource()) {
    const raw = await getDataSource()!.listMarketplaceLeads(scope);
    return raw.map((r) => ({
      id: r.id,
      title: r.specialty || "Lead",
      categoryLabel: (r.category || "").toUpperCase(),
      category: r.category || "",
      region: r.originRegion || "Unknown",
      city: r.currentLocation || "",
      quality: MP_Q[r.quality] ?? "warm",
      freshLabel: mpFresh(r.listedAt),
      spots: Math.max(0, r.maxPurchases - r.purchaseCount),
      views: r.viewCount,
      price: mpCurrentPrice(r.initialPrice, r.minPrice, r.decayAmount, r.decayInterval, r.listedAt),
      basePrice: r.initialPrice,
      dropAmount: r.decayAmount,
      dropInLabel: mpNextDropLabel(r.decayInterval, r.listedAt),
      dropAtLabel: mpDropAtLabel(r.decayInterval, r.listedAt),
      maskedName: mpMaskName(r.firstName, r.lastName),
      maskedPhone: mpMaskPhone(r.phone),
      channels: { phone: r.hasPhone, whatsapp: r.hasWhatsApp, email: r.hasEmail, linkedin: r.hasLinkedIn, cv: r.hasCV, dataflow: r.hasDataflow },
    }));
  }
  return listMarketLeads();
}
