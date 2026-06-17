import { describe, it, expect } from "vitest";
import { getApiScopes } from "./contract";
describe("developer contract", () => { it("has read + write", () => { const ids=getApiScopes().map(s=>s.id); expect(ids).toContain("read"); expect(ids).toContain("write"); }); });
