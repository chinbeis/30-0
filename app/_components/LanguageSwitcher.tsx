"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALE_META, locales } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LOCALE_META[locale];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="flex items-center gap-1.5 rounded-full border border-zinc-800 px-2.5 py-1 text-zinc-300 transition hover:border-zinc-600 hover:text-white"
      >
        <span className="text-base leading-none" aria-hidden>
          {current.flag}
        </span>
        <span className="hidden text-xs font-semibold sm:inline">{current.label}</span>
        <span className="text-[10px] text-zinc-500" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-2xl"
        >
          {locales.map((l) => {
            const meta = LOCALE_META[l];
            const active = l === locale;
            return (
              <button
                key={l}
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-zinc-900 ${
                  active ? "font-bold text-white" : "text-zinc-300"
                }`}
              >
                <span className="text-base leading-none" aria-hidden>
                  {meta.flag}
                </span>
                {meta.label}
                {active ? <span className="ml-auto text-amber-400">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
