import { describe, it, expect } from "vitest";
import { can } from "./permissions";
const grants = { OWNER: ["*"], SALES: ["books.invoice.read", "crm.deal.write"] };
describe("kernel: permissions", () => {
  it("owner wildcard grants anything", () => { expect(can(grants, "OWNER", "anything.at.all")).toBe(true); });
  it("scoped role grants only its keys", () => {
    expect(can(grants, "SALES", "books.invoice.read")).toBe(true);
    expect(can(grants, "SALES", "books.payments.record")).toBe(false);
  });
  it("unknown role denies", () => { expect(can(grants, "GHOST", "x")).toBe(false); });
});
