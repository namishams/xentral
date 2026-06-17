import { describe, it, expect, afterEach } from "vitest";
import { setSessionResolver, hasSessionResolver, __resetSessionResolver, resolveSession, currentScope } from "./auth";

afterEach(() => __resetSessionResolver());

describe("SessionPort", () => {
  it("returns null / undefined scope when no resolver is registered (preview-safe)", async () => {
    expect(hasSessionResolver()).toBe(false);
    expect(await resolveSession()).toBeNull();
    expect(await currentScope()).toBeUndefined();
  });

  it("derives the tenant scope from the resolved session", async () => {
    setSessionResolver(() => ({ userId: "u1", companyId: "T-42", role: "owner" }));
    expect(hasSessionResolver()).toBe(true);
    expect(await currentScope()).toEqual({ companyId: "T-42" });
  });

  it("supports async resolvers (cookie/JWT verification)", async () => {
    setSessionResolver(async () => ({ userId: "u2", companyId: "T-7", role: "member" }));
    const s = await resolveSession();
    expect(s?.companyId).toBe("T-7");
    expect(await currentScope()).toEqual({ companyId: "T-7" });
  });

  it("an authenticated session without a tenant is rejected (no silent cross-tenant)", async () => {
    setSessionResolver(() => ({ userId: "u3", companyId: "", role: "owner" }));
    await expect(currentScope()).rejects.toThrow();
  });
});
