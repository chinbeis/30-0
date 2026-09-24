import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  const t = await getT();
  const games = [
    { href: "/play", record: "30-0", title: t.home.classicTitle, line: t.home.classicLine },
    { href: "/goat", record: "13-0", title: t.home.goatTitle, line: t.home.goatLine },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-10 sm:py-16">
      <h1 className="sr-only">{t.home.classicTitle}</h1>
      <Image
        src="/logo/logo-30-0.png"
        alt="30-0 Undefeated"
        width={512}
        height={512}
        priority
        className="animate-pop h-44 w-44 drop-shadow-[0_0_40px_rgba(224,40,46,0.35)] sm:h-56 sm:w-56"
      />

      <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
        {games.map((g, i) => (
          <Link
            key={g.href}
            href={g.href}
            style={{ animationDelay: `${120 + i * 80}ms` }}
            className="animate-rise group relative flex flex-col overflow-hidden rounded-lg border border-white/10 bg-black/60 p-5 backdrop-blur-sm transition hover:border-fight/70"
          >
            <span className="absolute inset-y-0 left-0 w-1 bg-fight" aria-hidden />
            <span className="font-display text-7xl text-cream tabular-nums sm:text-8xl">
              {g.record}
            </span>
            <h2 className="font-display mt-3 text-2xl text-white">{g.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{g.line}</p>
            <span className="btn-fight mt-5 py-3 text-sm">
              {t.home.play}
              <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
