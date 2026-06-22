import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./config";
import { getDictionary, type Dict } from "./dictionaries";

/** Current locale from the cookie (Next 16: cookies() is async). */
export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : defaultLocale;
}

/** Dictionary for the current locale — use in server components. */
export async function getT(): Promise<Dict> {
  return getDictionary(await getLocale());
}
