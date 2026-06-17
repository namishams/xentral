import { describe, it, expect } from "vitest";
import { createLiveDataSource, type QueryFn } from "./index";

describe("data-pack live adapter", () => {
  it("tenant-scopes the query by companyId and maps rows", async () => {
    let capturedSql = "";
    let capturedParams: unknown[] = [];
    const fakeQuery: QueryFn = async (sql, params) => {
      capturedSql = sql;
      capturedParams = params;
      return {
        rows: [
          { id: "c1", firstName: "Aisha", lastName: "Rahman", title: "Lead", email: "a@x.ae", phone: "+9715", accountName: "Skyline", owner: "Nami" },
          { id: "c2", firstName: "Omar", lastName: null, title: null, email: null, phone: null, accountName: null, owner: null },
        ],
      };
    };
    const ds = createLiveDataSource(fakeQuery);
    const out = await ds.listContacts({ companyId: "T-123" });

    expect(capturedParams).toEqual(["T-123"]);
    expect(capturedSql).toContain('c."companyId" = $1');
    expect(capturedSql).toContain('"isArchived" = false');
    expect(out).toHaveLength(2);

    const [first, second] = out;
    expect(first).toMatchObject({ id: "c1", firstName: "Aisha", lastName: "Rahman", accountName: "Skyline", owner: "Nami" });
    // empty/null fields collapse to undefined, never leak null
    expect(second?.lastName).toBeUndefined();
    expect(second?.email).toBeUndefined();
    expect(second?.owner).toBeUndefined();
  });

  it("listCompanies is tenant-scoped and coerces openDeals to a number", async () => {
    let capturedSql = "";
    let capturedParams: unknown[] = [];
    const fakeQuery: QueryFn = async (sql, params) => {
      capturedSql = sql;
      capturedParams = params;
      return {
        rows: [
          { id: "a1", name: "Skyline Developers", industry: "Construction", city: "Dubai", owner: "Nami", openDeals: 3 },
          { id: "a2", name: "Gulf Trading", industry: null, city: null, owner: null, openDeals: "0" },
        ],
      };
    };
    const ds = createLiveDataSource(fakeQuery);
    const out = await ds.listCompanies({ companyId: "T-9" });

    expect(capturedParams).toEqual(["T-9"]);
    expect(capturedSql).toContain('a."companyId" = $1');
    const [first, second] = out;
    expect(first).toMatchObject({ id: "a1", name: "Skyline Developers", openDeals: 3 });
    expect(second?.openDeals).toBe(0);
    expect(second?.industry).toBeUndefined();
  });

  it("listLeads is tenant-scoped and maps probability → score", async () => {
    let capturedSql = "";
    let capturedParams: unknown[] = [];
    const fakeQuery: QueryFn = async (sql, params) => {
      capturedSql = sql;
      capturedParams = params;
      return {
        rows: [
          { id: "l1", firstName: "Hassan", lastName: "Ali", company: "Bright Interiors", source: "WHATSAPP", status: "QUALIFIED", probability: 82, owner: "Nami" },
          { id: "l2", firstName: "Priya", lastName: null, company: null, source: null, status: null, probability: null, owner: null },
        ],
      };
    };
    const ds = createLiveDataSource(fakeQuery);
    const out = await ds.listLeads({ companyId: "T-5" });

    expect(capturedParams).toEqual(["T-5"]);
    expect(capturedSql).toContain('l."companyId" = $1');
    const [first, second] = out;
    expect(first).toMatchObject({ id: "l1", firstName: "Hassan", company: "Bright Interiors", source: "WHATSAPP", score: 82 });
    expect(second?.score).toBe(0);
    expect(second?.company).toBeUndefined();
  });
});
