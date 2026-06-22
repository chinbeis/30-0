"use client";

import { signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function SignOutButton() {
  const { t } = useI18n();
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-1.5 text-sm font-semibold text-zinc-400 transition hover:text-white"
    >
      <span aria-hidden>⎋</span> {t.profile.signOut}
    </button>
  );
}
