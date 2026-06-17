import { describe, it, expect } from "vitest";
import { getListingKinds } from "./contract";
describe("marketplace contract", () => { it("includes lead", () => { expect(getListingKinds().map(k=>k.id)).toContain("lead"); }); });
