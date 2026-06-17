import { describe, it, expect, afterEach } from "vitest";
import { setLocaleCore, getLocaleCore, hasLocaleCore, __resetLocaleCore, type LocaleCore } from "./locale";

const stub: LocaleCore = {
  id: "stub",
  defaultLocale: "en",
  supported: ["en", "ar"],
  direction: (l) => (l === "ar" ? "rtl" : "ltr"),
  t: (_l, key, fallback) => fallback ?? key,
};

afterEach(() => __resetLocaleCore());

describe("kernel: locale core (swappable)", () => {
  it("fails loud when no pack is installed", () => {
    expect(hasLocaleCore()).toBe(false);
    expect(() => getLocaleCore()).toThrow("no-locale-core-installed");
  });

  it("installs and serves a language pack", () => {
    setLocaleCore(stub);
    expect(getLocaleCore().id).toBe("stub");
    expect(getLocaleCore().direction("ar")).toBe("rtl");
    expect(getLocaleCore().direction("en")).toBe("ltr");
    expect(getLocaleCore().t("en", "x.y", "Hello")).toBe("Hello");
  });

  it("is swappable — a second pack replaces the first", () => {
    setLocaleCore(stub);
    setLocaleCore({ ...stub, id: "other", defaultLocale: "fr" });
    expect(getLocaleCore().id).toBe("other");
    expect(getLocaleCore().defaultLocale).toBe("fr");
  });
});
