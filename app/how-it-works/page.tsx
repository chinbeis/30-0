import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works · Can You Go 30-0?",
  description:
    "The rules: draft 10 fighters, each fights 3 bouts, and we simulate a 30-fight season to see if you go a perfect 30-0.",
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 font-black text-black">
        {n}
      </div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm text-zinc-400">{children}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
      <h1 className="text-4xl font-black tracking-tight">How it works</h1>
      <p className="mt-3 text-zinc-400">
        One minute, ten choices, one verdict. Here&rsquo;s the whole game.
      </p>

      <section className="mt-10 space-y-6">
        <Step n={1} title="Draft 10 fighters">
          You get 10 rounds. Each round shows 3 random fighters from across MMA
          history &mdash; pick one and move on. No takebacks.
        </Step>
        <Step n={2} title="Every fighter fights 3 times">
          Your 10 picks fight 3 bouts each, for a 30-fight season. The schedule
          ramps up: tune-ups early, brutal title fights at the end.
        </Step>
        <Step n={3} title="We simulate the season">
          Each fighter has hidden ratings &mdash; striking, grappling, cardio,
          durability, fight IQ, experience, finishing. Style matchups and a little
          chaos decide every fight.
        </Step>
        <Step n={4} title="Find out if you went 30-0">
          One weak pick can drop all 3 of its fights and end your perfect run. See
          your record, GOAT score, team MVP, weakest pick, and the story of your
          season.
        </Step>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">The tiers</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {[
            ["30-0", "IMMORTAL", "text-amber-400"],
            ["29-1", "HALL OF FAMER", "text-emerald-400"],
            ["27-3 → 26-4", "CHAMPION", "text-sky-400"],
            ["24-6 →", "CONTENDER", "text-zinc-300"],
            ["lower", "JOURNEYMAN / GATEKEEPER", "text-zinc-400"],
          ].map(([rec, label, color]) => (
            <li
              key={label}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2"
            >
              <span className={`font-black ${color}`}>{rec}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-bold">A note on skill vs. luck</h2>
        <p className="mt-2 text-sm text-zinc-400">
          The sim is roughly 70% skill, 30% chaos. A great roster wins most fights,
          but even a perfect draft only goes 30-0 a small fraction of the time
          &mdash; that&rsquo;s the point. The fun is in getting agonizingly close and
          running it back.
        </p>
      </section>

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-10 py-3 text-lg font-black text-black transition hover:scale-105"
        >
          Play now
        </Link>
      </div>
    </main>
  );
}
