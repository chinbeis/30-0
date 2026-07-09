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
      {/* Hero */}
      <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-amber-500">
        {t.howItWorks.kicker}
      </p>
      <h1 className="mt-3 text-center text-5xl font-black leading-[0.95] tracking-tighter sm:text-6xl">
        {t.howItWorks.titleA}{" "}
        <span className="text-shimmer-gold drop-shadow-[0_2px_20px_rgba(245,158,11,0.25)]">
          {t.howItWorks.titleHighlight}
        </span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-center text-zinc-400">{t.howItWorks.subtitle}</p>

      {/* The 4 steps */}
      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {steps.map((s, i) => (
          <div
            key={s.title}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-rise card-sheen rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-base font-black text-black">
              {i + 1}
            </div>
            <h3 className="mt-3 font-black tracking-tight">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.body}</p>
          </div>
        ))}
      </section>

      {/* Tiers */}
      <section className="mt-12">
        <h2 className="text-center text-xs font-bold uppercase tracking-[0.35em] text-amber-500">
          {t.howItWorks.tiersTitle}
        </h2>
        <ul className="mt-5 space-y-1.5">
          {TIERS.map((tier, i) => (
            <li
              key={tier.label}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`animate-rise flex items-center justify-between rounded-xl border px-4 py-2.5 transition duration-200 hover:-translate-y-0.5 ${
                i === 0
                  ? "border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
              }`}
            >
              <span className={`font-black tabular-nums ${tier.color}`}>{tier.record}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {tier.label}
              </span>
            </li>
          ))}
          <li
            style={{ animationDelay: `${TIERS.length * 40}ms` }}
            className="animate-rise flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2.5"
          >
            <span className="font-black text-zinc-500">{t.howItWorks.tierLower}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              JOURNEYMAN / GATEKEEPER
            </span>
          </li>
        </ul>
      </section>

      {/* Skill vs luck callout */}
      <section className="mt-12 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight">
          <span aria-hidden>🎲</span> {t.howItWorks.luckTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t.howItWorks.luckBody}</p>
      </section>

      {/* Second game */}
      <Link
        href="/goat"
        className="group card-sheen mt-6 block rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/10"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl transition-transform duration-200 group-hover:scale-110" aria-hidden>
            🧬
          </span>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
            {t.howItWorks.goatBadge}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight">{t.howItWorks.goatTitle}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{t.howItWorks.goatBody}</p>
        <span className="mt-3 inline-block text-sm font-bold text-amber-400 transition group-hover:text-amber-300">
          {t.howItWorks.goatCta}
        </span>
      </Link>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-10 py-3 text-lg font-black text-black transition hover:scale-105 hover:brightness-110"
        >
          {t.howItWorks.playNow}
        </Link>
      </div>
    </main>
  );
}
