import { describe, it, expect } from "vitest";
import { localePack } from "./index";
describe("locale-pack", () => {
  it("supports en + ar", () => { expect(localePack.supported).toEqual(["en", "ar"]); });
  it("ar is rtl, en is ltr", () => { expect(localePack.direction("ar")).toBe("rtl"); expect(localePack.direction("en")).toBe("ltr"); });
  it("translates ar and falls back", () => {
    expect(localePack.t("ar", "action.send")).toBe("إرسال");
    expect(localePack.t("ar", "missing.key", "X")).toBe("X");
  });
});
