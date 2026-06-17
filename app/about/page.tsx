import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · Can You Go 30-0?",
  description:
    "About Can You Go 30-0? — a fan-made MMA roster game inspired by 82-0, and the data behind it.",
};

export default function About() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
      <h1 className="text-4xl font-black tracking-tight">About</h1>

      <div className="mt-6 space-y-5 text-zinc-300">
        <p>
          <strong>Can You Go 30&ndash;0?</strong> is a quick, replayable game for
          MMA fans. Draft a roster, simulate a season, and chase the perfect record.
          It&rsquo;s built to settle &mdash; and start &mdash; arguments about who the
          best fighters really are.
        </p>
        <p>
          It&rsquo;s inspired by{" "}
          <a
            href="https://82-0.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-amber-400 hover:underline"
          >
            82-0
          </a>
          , the NBA roster game. We borrowed the psychology &mdash; tiny time
          commitment, no learning curve, endlessly debatable results &mdash; not the
          content.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">The ratings</h2>
        <p>
          Fighter ratings are subjective and editorial &mdash; our read on each
          fighter&rsquo;s striking, grappling, cardio, durability, fight IQ,
          experience, and finishing. They are <em>not</em> official stats, and
          you&rsquo;ll probably disagree with some. That&rsquo;s half the fun. Think a
          fighter is underrated? You might be right.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">Photos &amp; data</h2>
        <p>
          Fighter photos come from{" "}
          <a
            href="https://commons.wikimedia.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-amber-400 hover:underline"
          >
            Wikimedia Commons
          </a>{" "}
          under their respective free licenses. Where no suitable photo exists, we
          show a monogram instead.
        </p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-400">
          This is an unofficial fan project. It is not affiliated with, endorsed by,
          or sponsored by the UFC, Zuffa, or any athlete. All fighter names and
          likenesses are the property of their respective owners.
        </div>
      </div>

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
