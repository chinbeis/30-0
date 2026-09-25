import Link from "next/link";
import Image from "next/image";
import { auth, googleEnabled } from "@/auth";
import { getT } from "@/lib/i18n/server";
import { AuthControls } from "./AuthControls";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLinks } from "./NavLinks";
import { SoundToggle } from "./SoundToggle";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user ?? null;
  const t = await getT();

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="30-0 home">
            <Image
              src="/logo/logo-30-0.png"
              alt=""
              width={36}
              height={36}
              preload
              className="h-9 w-9"
            />
            <span className="font-display hidden text-xl leading-none text-white sm:inline">30-0</span>
          </Link>
          <nav className="flex min-w-0 items-center">
            <NavLinks
              links={[
                { href: "/", label: t.nav.play, also: ["/play", "/goat", "/challenge"] },
                { href: "/leaderboard", label: t.nav.leaderboard },
              ]}
            />
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <SoundToggle labelOn={t.nav.soundOn} labelOff={t.nav.soundOff} />
          <LanguageSwitcher />
          <AuthControls
            user={user ? { name: user.name ?? null, image: user.image ?? null } : null}
            googleEnabled={googleEnabled}
          />
        </div>
      </div>
    </header>
  );
}
