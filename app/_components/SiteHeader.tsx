import Link from "next/link";
import Image from "next/image";
import { auth, googleEnabled } from "@/auth";
import { getT } from "@/lib/i18n/server";
import { AuthControls } from "./AuthControls";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user ?? null;
  const t = await getT();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-900 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center transition-transform hover:scale-105 active:scale-95"
          aria-label="30-0 home"
        >
          <Image
            src="/logo/logo.png"
            alt="30-0"
            width={36}
            height={36}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav className="flex min-w-0 items-center gap-1 text-sm font-semibold text-zinc-400 sm:gap-2">
          <Link
            href="/"
            className="rounded-full px-2.5 py-1.5 transition hover:bg-zinc-900 hover:text-white"
          >
            {t.nav.play}
          </Link>
          <Link
            href="/leaderboard"
            className="truncate rounded-full px-2.5 py-1.5 transition hover:bg-zinc-900 hover:text-white"
          >
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
