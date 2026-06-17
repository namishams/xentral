/**
 * UPDATE PORT — the swappable update seam (ports & adapters).
 *
 * The kernel owns the port; the strategy (Changesets, manual, a remote
 * registry, …) is a swappable adapter installed at the composition root and
 * selected by the profile (`updates.core`). This is what makes updates
 * DECOUPLED: `check()` reports per-package what actually changed, so one module
 * updates without touching the rest.
 */

export type PackageVersion = { name: string; version: string };
export type UpdateInfo = { name: string; current: string; latest: string; hasUpdate: boolean };

export interface UpdatePort {
  readonly id: string;
  /** Strategy/channel, e.g. "changesets" | "manual" | "registry". */
  readonly channel: string;
  /** Currently installed package versions. */
  current(): PackageVersion[];
  /** Per-package update status given the latest known versions. */
  check(latest: Record<string, string>): UpdateInfo[];
}

/** Compare "x.y.z" semver-ish strings. Returns -1, 0, or 1. */
export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

let active: UpdatePort | null = null;

/** Install the update strategy. Called once at boot (composition root). */
export function setUpdatePort(impl: UpdatePort): void {
  active = impl;
}

/** Access the installed update strategy. Fails loud if none installed. */
export function getUpdatePort(): UpdatePort {
  if (!active) throw new Error("no-update-port-installed");
  return active;
}

export function hasUpdatePort(): boolean {
  return active !== null;
}

/** Test isolation only. */
export function __resetUpdatePort(): void {
  active = null;
}
