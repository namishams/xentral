/**
 * @xentral/module-crm — PUBLIC CONTRACT.
 * The only surface other packages may import.
 */

export type PipelineStage = { id: string; label: string; order: number };
export function getDefaultPipeline(): PipelineStage[] {
  return [
    { id: "new", label: "New", order: 1 },
    { id: "qualified", label: "Qualified", order: 2 },
    { id: "proposal", label: "Proposal", order: 3 },
    { id: "won", label: "Won", order: 4 },
    { id: "lost", label: "Lost", order: 5 },
  ];
}

export type DealStage = "new" | "qualified" | "proposal" | "won" | "lost";
export type DealRow = {
  id: string;
  name: string;
  account: string;
  stage: DealStage;
  value: number;
  currency: string;
  owner: string;
};

/** List deals for the workspace. Seeded now; a real adapter replaces the body later. */
export function listDeals(): DealRow[] {
  return [
    { id: "d1", name: "Skyline Tower fit-out", account: "Skyline Developers", stage: "proposal", value: 480000, currency: "AED", owner: "Nami" },
    { id: "d2", name: "Office relocation", account: "Gulf Trading", stage: "qualified", value: 120000, currency: "AED", owner: "Sara" },
    { id: "d3", name: "Brokerage retainer", account: "Al Noor Real Estate", stage: "won", value: 90000, currency: "AED", owner: "Nami" },
    { id: "d4", name: "Villa portfolio", account: "Damac Properties", stage: "new", value: 250000, currency: "AED", owner: "Omar" },
    { id: "d5", name: "Mall units", account: "Emaar Group", stage: "lost", value: 310000, currency: "AED", owner: "Sara" },
  ];
}
