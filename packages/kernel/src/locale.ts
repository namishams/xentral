/**
 * LOCALE CORE — the swappable language seam (ports & adapters).
 *
 * The kernel owns the PORT (this interface + registry). The actual language
 * pack is a separate, swappable implementation (e.g. @xentral/locale-pack),
 * installed once at the app composition root and selected by the profile
 * (`locale.core`). Swap the pack to change languages/RTL for a whole
 * architecture version — modules only ever call getLocaleCore(), never a pack.
 */

export type Locale = string;            // BCP-47-ish, e.g. "en", "ar"
export type Direction = "ltr" | "rtl";

export interface LocaleCore {
  /** Pack identifier, e.g. "en-ar". */
  readonly id: string;
  readonly defaultLocale: Locale;
  readonly supported: Locale[];
  /** Writing direction for a locale. */
  direction(locale: Locale): Direction;
  /** Translate a dotted key; falls back to `fallback` then the key itself. */
  t(locale: Locale, key: string, fallback?: string): string;
}

let active: LocaleCore | null = null;

/** Install the language pack. Called once at boot (composition root). */
export function setLocaleCore(impl: LocaleCore): void {
  active = impl;
}

/** Access the installed language pack. Fails loud if none installed. */
export function getLocaleCore(): LocaleCore {
  if (!active) throw new Error("no-locale-core-installed");
  return active;
}

export function hasLocaleCore(): boolean {
  return active !== null;
}

/** Test isolation only. */
export function __resetLocaleCore(): void {
  active = null;
}
