import { describe, it, expect } from "vitest";
import { PARTY_ROLES, partyLabel } from "./party";
describe("kernel: party", () => {
  it("exposes the four roles", () => { expect(PARTY_ROLES).toContain("customer"); expect(PARTY_ROLES).toContain("supplier"); });
  it("labels a party by name", () => { expect(partyLabel({ id: "p", kind: "organization", name: "  Acme  " })).toBe("Acme"); });
});
