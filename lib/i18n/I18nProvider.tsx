"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./config";
import { getDictionary, type Dict } from "./dictionaries";

type Ctx = { locale: Locale; t: Dict; setLocale: (l: Locale) => void };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (l: Locale) => {
      // Persist for both the server (cookie) and quick client reads (localStorage).
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
      try {
        localStorage.setItem(LOCALE_COOKIE, l);
      } catch {
        /* ignore */
      }
      setLocaleState(l);
      router.refresh(); // re-render server components with the new cookie
    },
    [router],
  );

  return (
    <I18nContext.Provider value={{ locale, t: getDictionary(locale), setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
