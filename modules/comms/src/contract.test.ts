import { describe, it, expect } from "vitest";
import { getChannelKinds } from "./contract";
describe("comms contract", () => {
  it("channels are tool-archetype", () => {
    const all = getChannelKinds();
    expect(all.every((k) => k.archetype === "tool")).toBe(true);
    expect(all.map((k) => k.id)).toContain("whatsapp");
  });
});
