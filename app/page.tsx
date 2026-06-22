import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  const t = await getT();
  const games = [
    {
      href: "/play",
      emoji: "🥊",
      badge: t.home.classicBadge,
      title: t.home.classicTitle,
      blurb: t.home.classicBlurb,
      cta: t.home.classicCta,
    },
    {
      href: "/goat",
      emoji: "🧬",
      badge: t.home.goatBadge,
      title: t.home.goatTitle,
      blurb: t.home.goatBlurb,
      cta: t.home.goatCta,
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-12">
      <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">
        {t.home.kicker}
      </p>
      <h1 className="text-center text-5xl font-black tracking-tight sm:text-6xl">
        {t.home.titleA}{" "}
        <span className="bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
          {t.home.titleHighlight}
        </span>
      </h1>
      <p className="mt-4 max-w-md text-center text-zinc-400">{t.home.subtitle}</p>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
        {games.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group flex flex-col rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-6 transition hover:border-amber-500/60 hover:from-zinc-900 hover:to-zinc-950 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="text-3xl" aria-hidden>
                {g.emoji}
              </span>
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                {g.badge}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight">{g.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{g.blurb}</p>
            <span className="mt-5 inline-block rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-6 py-3 text-center text-sm font-black text-black transition group-hover:scale-[1.02]">
              {g.cta}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-zinc-400">
        <Link href="/leaderboard" className="transition hover:text-white">
          🏆 {t.home.leaderboard}
        </Link>
        <Link href="/how-it-works" className="transition hover:text-white">
          {t.home.howItWorks}
        </Link>
        <Link href="/about" className="transition hover:text-white">
          {t.home.about}
        </Link>
      </div>
    </main>
  );
}
