export type PartyKind = "person" | "organization";
export type PartyRoleName = "customer" | "supplier" | "contact" | "account";
export type Party = { id: string; kind: PartyKind; name: string };

export const PARTY_ROLES: PartyRoleName[] = ["customer", "supplier", "contact", "account"];
export function partyLabel(p: Party): string { return p.name.trim(); }
