export type ListingKind = { id: string; label: string };
export function getListingKinds(): ListingKind[] {
  return [{ id: "lead", label: "Lead" }, { id: "saved-search", label: "Saved search" }];
}
