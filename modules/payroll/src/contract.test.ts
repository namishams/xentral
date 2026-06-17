import { describe, it, expect } from "vitest";
import { getPayrollRegimes } from "./contract";
describe("payroll contract", () => { it("supports WPS", () => { expect(getPayrollRegimes().map(r=>r.id)).toContain("wps"); }); });
