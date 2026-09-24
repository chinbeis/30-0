import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "How it works · Can You Go 30-0?",
  description:
    "The rules: draft 10 fighters, each fights 3 bouts, and we simulate a 30-fight season to see if you go a perfect 30-0.",
};

const TIERS: { record: string; label: string; color: string }[] = [
  { record: "30-0", label: "IMMORTAL", color: "text-amber-400" },
  { record: "29-1", label: "HALL OF FAMER", color: "text-emerald-400" },
  { record: "27-3 → 26-4", label: "CHAMPION", color: "text-sky-400" },
  { record: "24-6 →", label: "CONTENDER", color: "text-zinc-300" },
];

export default async function HowItWorks() {
  const t = await getT();

  const steps = [
    { title: t.howItWorks.step1Title, body: t.howItWorks.step1Body },
    { title: t.howItWorks.step2Title, body: t.howItWorks.step2Body },
    { title: t.howItWorks.step3Title, body: t.howItWorks.step3Body },
    { title: t.howItWorks.step4Title, body: t.howItWorks.step4Body },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-14 sm:py-16">
      <h1 className="font-display text-center text-6xl sm:text-7xl">
        {t.howItWorks.titleA} <span className="text-fight">{t.howItWorks.titleHighlight}</span>
      </h1>

      {/* The 4 steps */}
      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {steps.map((s, i) => (
          <div
            key={s.title}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-rise rounded-lg border border-white/10 bg-black/60 p-5 backdrop-blur-sm"
          >
            <div className="font-display text-4xl text-fight">
              {i + 1}
            </div>
            <h3 className="mt-3 font-display text-xl">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.body}</p>
          </div>
        ))}
      </section>

      {/* Tiers */}
      <section className="mt-12">
        <h2 className="font-display text-center text-3xl">
          {t.howItWorks.tiersTitle}
        </h2>
        <ul className="mt-5 space-y-1.5">
          {TIERS.map((tier, i) => (
            <li
              key={tier.label}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`animate-rise flex items-center justify-between rounded-md border px-4 py-2.5 backdrop-blur-sm ${
                i === 0 ? "border-amber-400/40 bg-black/60" : "border-white/10 bg-black/60"
              }`}
            >
              <span className={`font-display text-2xl tabular-nums ${tier.color}`}>{tier.record}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {tier.label}
              </span>
            </li>
          ))}
          <li
            style={{ animationDelay: `${TIERS.length * 40}ms` }}
            className="animate-rise flex items-center justify-between rounded-md border border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-sm"
          >
            <span className="font-black text-zinc-500">{t.howItWorks.tierLower}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              JOURNEYMAN / GATEKEEPER
            </span>
          </li>
        </ul>
      </section>

      {/* Skill vs luck callout */}
      <section className="mt-12 rounded-lg border-l-4 border-fight bg-black/60 p-5 backdrop-blur-sm">
        <h2 className="flex items-center gap-2 text-lg font-display text-xl">
          <span aria-hidden>🎲</span> {t.howItWorks.luckTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t.howItWorks.luckBody}</p>
      </section>

      {/* Second game */}
      <Link
        href="/goat"
        className="group mt-6 block rounded-lg border border-white/10 bg-black/60 p-5 backdrop-blur-sm transition hover:border-fight/70"
      >
        <h2 className="font-display text-2xl">{t.howItWorks.goatTitle}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{t.howItWorks.goatBody}</p>
        <span className="mt-3 inline-block text-sm font-bold uppercase tracking-wider text-fight transition group-hover:text-fight-hot">
          {t.howItWorks.goatCta}
        </span>
      </Link>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="btn-fight px-10 py-3.5 text-base"
        >
          {t.howItWorks.playNow}
        </Link>
      </div>
    </main>
  );
}
