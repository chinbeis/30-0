import Link from "next/link";
import Image from "next/image";
import { auth, signIn, signOut, googleEnabled } from "@/auth";

const NAV = [
  { href: "/", label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/how-it-works", label: "How it works" },
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

          {user ? (
            <div className="flex items-center gap-2">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "You"}
                  width={26}
                  height={26}
                  className="rounded-full"
                />
              ) : null}
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button className="text-zinc-500 transition hover:text-white" title="Sign out">
                  Sign out
                </button>
              </form>
            </div>
          ) : googleEnabled ? (
            <form
              action={async () => {
                "use server";
                await signIn("google");
              }}
            >
              <button className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black transition hover:bg-zinc-200">
                Sign in
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
