import { describe, it, expect, afterEach } from "vitest";
import { compareSemver, setUpdatePort, getUpdatePort, hasUpdatePort, __resetUpdatePort, type UpdatePort } from "./update";

afterEach(() => __resetUpdatePort());

describe("kernel: compareSemver", () => {
  it("orders versions", () => {
    expect(compareSemver("0.2.0", "0.1.0")).toBe(1);
    expect(compareSemver("1.0.0", "1.0.0")).toBe(0);
    expect(compareSemver("0.1.0", "0.1.2")).toBe(-1);
  });
});

describe("kernel: update port (swappable, decoupled)", () => {
  const stub: UpdatePort = {
    id: "stub",
    channel: "changesets",
    current: () => [{ name: "@xentral/ui", version: "0.1.0" }],
    check: (latest) => [{ name: "@xentral/ui", current: "0.1.0", latest: latest["@xentral/ui"] ?? "0.1.0", hasUpdate: compareSemver(latest["@xentral/ui"] ?? "0.1.0", "0.1.0") > 0 }],
  };

  it("fails loud when none installed", () => {
    expect(hasUpdatePort()).toBe(false);
    expect(() => getUpdatePort()).toThrow("no-update-port-installed");
  });

  it("reports per-package updates (only what changed)", () => {
    setUpdatePort(stub);
    const out = getUpdatePort().check({ "@xentral/ui": "0.2.0" });
    expect(out[0]?.hasUpdate).toBe(true);
    expect(getUpdatePort().check({})[0]?.hasUpdate).toBe(false);
  });
});
