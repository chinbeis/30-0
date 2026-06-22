export const locales = ["en", "pt", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "locale";

export const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  pt: { label: "Português", flag: "🇧🇷" },
  es: { label: "Español", flag: "🇲🇽" },
};

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "en" || v === "pt" || v === "es";
}
