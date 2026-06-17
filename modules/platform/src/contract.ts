export type PlanTier = { id: string; label: string };
export function getPlanTiers(): PlanTier[] {
  return [{ id: "free", label: "Free" }, { id: "pro", label: "Pro" }, { id: "enterprise", label: "Enterprise" }];
}
