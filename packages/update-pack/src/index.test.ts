import { describe, it, expect } from "vitest";
import { updatePack } from "./index";
describe("update-pack", () => {
  it("uses the changesets channel", () => { expect(updatePack.channel).toBe("changesets"); });
  it("flags only the package that changed", () => {
    const out = updatePack.check({ "@xentral/ui": "0.2.0" });
    const ui = out.find((p) => p.name === "@xentral/ui");
    const kernel = out.find((p) => p.name === "@xentral/kernel");
    expect(ui?.hasUpdate).toBe(true);
    expect(kernel?.hasUpdate).toBe(false);
  });
});
