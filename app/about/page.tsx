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
      <h1 className="font-display text-center text-6xl sm:text-7xl">
        {t.about.titleA} <span className="text-fight">{t.about.titleHighlight}</span>
      </h1>

      {/* Story */}
      <div className="mx-auto mt-10 max-w-xl space-y-5 text-zinc-300">
        <p className="leading-relaxed">{t.about.p1}</p>
        <p className="leading-relaxed">
          {t.about.inspiredPre}
          <a
            href="https://82-0.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline decoration-fight decoration-2 underline-offset-2 transition hover:text-fight"
          >
            {t.about.inspiredLink}
          </a>
          {t.about.inspiredPost}
        </p>
      </div>

      {/* Ratings + Photos cards */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="animate-rise rounded-lg border border-white/10 bg-black/60 p-5 backdrop-blur-sm">
          <h2 className="font-display text-xl">{t.about.ratingsTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{t.about.ratingsBody}</p>
        </div>
        <div
          style={{ animationDelay: "60ms" }}
          className="animate-rise rounded-lg border border-white/10 bg-black/60 p-5 backdrop-blur-sm"
        >
          <h2 className="font-display text-xl">{t.about.photosTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
            {t.about.photosPre}
            <a
              href="https://commons.wikimedia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline decoration-fight decoration-2 underline-offset-2 transition hover:text-fight"
            >
              {t.about.photosLink}
            </a>
            {t.about.photosPost}
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="mt-6 rounded-lg border border-white/10 bg-black/60 p-5 text-sm leading-relaxed text-zinc-500 backdrop-blur-sm">
        {t.about.disclaimer}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="btn-fight px-10 py-3.5 text-base"
        >
          {t.about.playNow}
        </Link>
      </div>
    </main>
  );
}
