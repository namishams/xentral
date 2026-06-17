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

  it("listActivities coerces Date createdAt to ISO and booleans", async () => {
    const when = new Date("2026-06-01T10:00:00.000Z");
    const fakeQuery: QueryFn = async () => ({
      rows: [{ id: "ac1", type: "CALL", subject: "Intro call", content: "Talked pricing", isCompleted: true, createdAt: when, user: "Nami" }],
    });
    const out = await createLiveDataSource(fakeQuery).listActivities({ companyId: "T-1" });
    expect(out[0]).toMatchObject({ id: "ac1", type: "CALL", isCompleted: true, createdAt: "2026-06-01T10:00:00.000Z", user: "Nami" });
  });

  it("listTasks is tenant-scoped and maps owner + due", async () => {
    let capturedParams: unknown[] = [];
    const fakeQuery: QueryFn = async (_sql, params) => {
      capturedParams = params;
      return { rows: [
        { id: "tk1", title: "Send proposal", dueAt: "2026-06-20", isCompleted: false, priority: "HIGH", owner: "Sara" },
        { id: "tk2", title: "Follow up", dueAt: null, isCompleted: true, priority: "LOW", owner: null },
      ] };
    };
    const out = await createLiveDataSource(fakeQuery).listTasks({ companyId: "T-2" });
    expect(capturedParams).toEqual(["T-2"]);
    expect(out[0]).toMatchObject({ id: "tk1", title: "Send proposal", priority: "HIGH", owner: "Sara" });
    expect(out[1]?.dueAt).toBeUndefined();
    expect(out[1]?.isCompleted).toBe(true);
  });

  it("listUsers is tenant-scoped and maps role + active flag", async () => {
    let capturedParams: unknown[] = [];
    const fakeQuery: QueryFn = async (_sql, params) => {
      capturedParams = params;
      return { rows: [
        { id: "u1", name: "Nami", email: "nami@x.ae", role: "OWNER", isActive: true, lastLoginAt: new Date("2026-06-16T08:00:00.000Z") },
        { id: "u2", name: "Sara", email: "sara@x.ae", role: "SALES", isActive: false, lastLoginAt: null },
      ] };
    };
    const out = await createLiveDataSource(fakeQuery).listUsers({ companyId: "T-3" });
    expect(capturedParams).toEqual(["T-3"]);
    expect(out[0]).toMatchObject({ id: "u1", name: "Nami", role: "OWNER", isActive: true, lastLoginAt: "2026-06-16T08:00:00.000Z" });
    expect(out[1]?.isActive).toBe(false);
    expect(out[1]?.lastLoginAt).toBeUndefined();
  });
});
