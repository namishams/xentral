import { compareSemver, type UpdatePort, type PackageVersion } from "@xentral/kernel";

/** Installed versions. In a real deploy these come from the workspace manifest. */
const INSTALLED: PackageVersion[] = [
  { name: "@xentral/kernel", version: "0.1.0" },
  { name: "@xentral/ui", version: "0.1.0" },
  { name: "@xentral/locale-pack", version: "0.1.0" },
  { name: "@xentral/module-marketing", version: "0.1.0" },
];

/** @xentral/update-pack — default update strategy over Changesets. Decoupled per package. */
export const updatePack: UpdatePort = {
  id: "changesets",
  channel: "changesets",
  current: () => INSTALLED,
  check: (latest) =>
    INSTALLED.map((p) => {
      const l = latest[p.name] ?? p.version;
      return { name: p.name, current: p.version, latest: l, hasUpdate: compareSemver(l, p.version) > 0 };
    }),
};

export default updatePack;
