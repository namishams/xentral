import { describe, it, expect } from "vitest";
import { formatFrom } from "./email";
describe("kernel: email", () => {
  it("formats with and without a display name", () => {
    expect(formatFrom({ address: "a@x.ae", name: "Acme" })).toBe('"Acme" <a@x.ae>');
    expect(formatFrom({ address: "a@x.ae" })).toBe("a@x.ae");
  });
});
