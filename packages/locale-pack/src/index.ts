import type { LocaleCore, Locale, Direction } from "@xentral/kernel";

/** Starter dictionary. Real strings grow here; the shape is what the port guarantees. */
const DICT: Record<string, Record<string, string>> = {
  en: {
    "nav.dashboard": "Mission control",
    "action.send": "Send",
    "money.balanceDue": "Balance due",
    "status.partiallyPaid": "Partially paid",
  },
  ar: {
    "nav.dashboard": "مركز التحكم",
    "action.send": "إرسال",
    "money.balanceDue": "الرصيد المستحق",
    "status.partiallyPaid": "مدفوعة جزئيًا",
  },
};

/** @xentral/locale-pack — the default swappable language pack (English + Arabic, RTL). */
export const localePack: LocaleCore = {
  id: "en-ar",
  defaultLocale: "en",
  supported: ["en", "ar"],
  direction: (l: Locale): Direction => (l === "ar" ? "rtl" : "ltr"),
  t: (l: Locale, key: string, fallback?: string): string =>
    DICT[l]?.[key] ?? DICT["en"]?.[key] ?? fallback ?? key,
};

export default localePack;
