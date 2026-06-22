import Link from "next/link";
import { auth, googleEnabled } from "@/auth";
import { getT } from "@/lib/i18n/server";
import { AuthControls } from "./AuthControls";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user ?? null;
  const t = await getT();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-900 bg-black/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-black tracking-tight">
          <span aria-hidden>🥊</span>
          <span className="bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
            30&ndash;0
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-400 sm:gap-3">
          <Link href="/" className="transition hover:text-white">
            {t.nav.play}
          </Link>
          <Link href="/leaderboard" className="truncate transition hover:text-white">
            {t.nav.leaderboard}
          </Link>

          <LanguageSwitcher />

          <AuthControls
            user={user ? { name: user.name ?? null, image: user.image ?? null } : null}
            googleEnabled={googleEnabled}
          />
        </nav>
      </div>
    </header>
  );
}
