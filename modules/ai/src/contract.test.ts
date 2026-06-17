import { describe, it, expect } from "vitest";
import { getAgentRoles } from "./contract";
describe("ai contract", () => {
  it("includes the five seeded agent roles", () => {
    const ids = getAgentRoles().map((r) => r.id);
    ["architect","backend","frontend","ux","export-assistant"].forEach((r) => expect(ids).toContain(r));
  });
});
