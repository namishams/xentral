import { describe, it, expect } from "vitest";
import { getMarketingHighlights } from "./contract";

describe("marketing contract", () => {
  it("returns highlights with a stable shape", () => {
    const items = getMarketingHighlights();
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const x of items) {
      expect(x.id).toBeTruthy();
      expect(x.title).toBeTruthy();
      expect(x.body).toBeTruthy();
    }
  });

  it("has unique ids", () => {
    const ids = getMarketingHighlights().map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
