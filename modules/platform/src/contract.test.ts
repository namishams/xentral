import { describe, it, expect } from "vitest";
import { getPlanTiers } from "./contract";
describe("platform contract", () => { it("offers free..enterprise", () => { const ids=getPlanTiers().map(t=>t.id); expect(ids).toEqual(["free","pro","enterprise"]); }); });
