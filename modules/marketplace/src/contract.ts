export type ListingKind = { id: string; label: string };
export function getListingKinds(): ListingKind[] {
  return [{ id: "lead", label: "Lead" }, { id: "saved-search", label: "Saved search" }];
}

/* ── Lead marketplace (UAE). Dutch-auction style: price drops over time until bought.
 *    Seeded, fully fictional — NEVER real PII on the public preview. ── */

export type LeadQuality = "hot" | "warm" | "standard";

export type MarketLead = {
  id: string;
  specialty: string;
  category: string;
  region: string;
  quality: LeadQuality;
  price: number;        // current price (AED)
  basePrice: number;    // original list price (AED)
  experienceYears: number;
  location: string;
  summary: string;
  phone: boolean;
  whatsapp: boolean;
  email: boolean;
  linkedin: boolean;
  postedAgo: string;
};

export function getMarketCategories(): { id: string; label: string }[] {
  return [
    { id: "all", label: "All categories" },
    { id: "real-estate", label: "Real estate" },
    { id: "healthcare", label: "Healthcare" },
    { id: "construction", label: "Construction" },
    { id: "retail", label: "Retail & e-commerce" },
    { id: "logistics", label: "Logistics" },
    { id: "professional", label: "Professional services" },
  ];
}

export function getRegions(): { id: string; label: string }[] {
  return [
    { id: "all", label: "All emirates" },
    { id: "dubai", label: "Dubai" },
    { id: "abu-dhabi", label: "Abu Dhabi" },
    { id: "sharjah", label: "Sharjah" },
    { id: "gcc", label: "Wider GCC" },
  ];
}

/** Seeded marketplace leads — fictional. A real adapter replaces this body later. */
export function listMarketLeads(): MarketLead[] {
  return [
    { id: "m1", specialty: "Villa buyer — Palm Jumeirah", category: "real-estate", region: "dubai", quality: "hot", price: 320, basePrice: 480, experienceYears: 0, location: "Dubai", summary: "Cash-ready buyer seeking 4–5BR villa, budget AED 12–18M, moving in 60 days.", phone: true, whatsapp: true, email: true, linkedin: false, postedAgo: "2h ago" },
    { id: "m2", specialty: "Clinic fit-out project", category: "healthcare", region: "abu-dhabi", quality: "hot", price: 280, basePrice: 400, experienceYears: 0, location: "Abu Dhabi", summary: "New dental clinic needs full fit-out + equipment, DHA licensing in progress.", phone: true, whatsapp: true, email: true, linkedin: true, postedAgo: "5h ago" },
    { id: "m3", specialty: "Warehouse lease — 2,000 m²", category: "logistics", region: "sharjah", quality: "warm", price: 150, basePrice: 220, experienceYears: 0, location: "Sharjah", summary: "3PL operator expanding, needs temperature-controlled space near port.", phone: true, whatsapp: false, email: true, linkedin: false, postedAgo: "1d ago" },
    { id: "m4", specialty: "Retail POS rollout (12 stores)", category: "retail", region: "dubai", quality: "warm", price: 190, basePrice: 260, experienceYears: 0, location: "Dubai", summary: "Fashion chain replacing POS + inventory across 12 mall locations.", phone: true, whatsapp: true, email: false, linkedin: true, postedAgo: "1d ago" },
    { id: "m5", specialty: "Tower MEP contractor", category: "construction", region: "dubai", quality: "standard", price: 90, basePrice: 160, experienceYears: 0, location: "Dubai", summary: "G+24 residential tower seeking MEP subcontractor, tender closes in 3 weeks.", phone: true, whatsapp: false, email: true, linkedin: false, postedAgo: "2d ago" },
    { id: "m6", specialty: "Bookkeeping retainer", category: "professional", region: "gcc", quality: "standard", price: 70, basePrice: 120, experienceYears: 0, location: "Riyadh", summary: "SME group wants monthly bookkeeping + VAT filing across 3 entities.", phone: false, whatsapp: true, email: true, linkedin: true, postedAgo: "3d ago" },
  ];
}
