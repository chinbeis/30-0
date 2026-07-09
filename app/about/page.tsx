import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "About · Can You Go 30-0?",
  description:
    "About Can You Go 30-0? — a fan-made MMA roster game inspired by 82-0, and the data behind it.",
};

export default async function About() {
  const t = await getT();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-14 sm:py-16">
      {/* Hero */}
      <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-amber-500">
        {t.about.kicker}
      </p>
      <h1 className="mt-3 text-center text-5xl font-black leading-[0.95] tracking-tighter sm:text-6xl">
        {t.about.titleA}{" "}
        <span className="text-shimmer-gold drop-shadow-[0_2px_20px_rgba(245,158,11,0.25)]">
          {t.about.titleHighlight}
        </span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-center text-zinc-400">{t.about.subtitle}</p>

      {/* Story */}
      <div className="mx-auto mt-10 max-w-xl space-y-5 text-zinc-300">
        <p className="leading-relaxed">{t.about.p1}</p>
        <p className="leading-relaxed">
          {t.about.inspiredPre}
          <a
            href="https://82-0.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-amber-400 transition hover:text-amber-300 hover:underline"
          >
            {t.about.inspiredLink}
          </a>
          {t.about.inspiredPost}
        </p>
      </div>

      {/* Ratings + Photos cards */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="animate-rise card-sheen rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/40">
          <div className="text-2xl" aria-hidden>
            📊
          </div>
          <h2 className="mt-3 font-black tracking-tight">{t.about.ratingsTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{t.about.ratingsBody}</p>
        </div>
        <div
          style={{ animationDelay: "60ms" }}
          className="animate-rise card-sheen rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/40"
        >
          <div className="text-2xl" aria-hidden>
            📸
          </div>
          <h2 className="mt-3 font-black tracking-tight">{t.about.photosTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
            {t.about.photosPre}
            <a
              href="https://commons.wikimedia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-amber-400 transition hover:text-amber-300 hover:underline"
            >
              {t.about.photosLink}
            </a>
            {t.about.photosPost}
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm leading-relaxed text-zinc-500">
        {t.about.disclaimer}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-10 py-3 text-lg font-black text-black transition hover:scale-105 hover:brightness-110"
        >
          {t.about.playNow}
        </Link>
      </div>
    </main>
  );
}
