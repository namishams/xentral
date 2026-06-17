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
});
