import Link from "next/link";
import { auth, googleEnabled } from "@/auth";
import { AuthControls } from "./AuthControls";

const NAV = [
  { href: "/", label: "30-0" },
  { href: "/goat", label: "GOAT" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-900 bg-black/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
          <span aria-hidden>🥊</span>
          <span className="bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
            30&ndash;0
          </span>
        </Link>

        <nav className="flex items-center gap-3 text-sm font-semibold text-zinc-400 sm:gap-4">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-white">
              {n.label}
            </Link>
          ))}

          <AuthControls
            user={user ? { name: user.name ?? null, image: user.image ?? null } : null}
            googleEnabled={googleEnabled}
          />
        </nav>
      </div>
    </header>
  );
}
