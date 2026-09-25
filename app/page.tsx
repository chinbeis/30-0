import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getFighter } from "@/lib/game/fighters";
import { ovr } from "@/lib/game/engine";
import { fighterImage } from "./_game/helpers";
import { ratingText } from "./_components/ratings";
import { PersonalBest } from "./_components/PersonalBest";
import { SfxZone } from "./_components/SfxZone";

// A "dealt hand" in the hero — the same card the draft shows, so the first
// thing a visitor sees is the actual game, not a marketing illustration.
const HAND = [
  { id: "khabib", label: "Khabib", tilt: "-rotate-[8deg] -translate-x-[150%] translate-y-5" },
  { id: "mythic_poirier", tilt: "z-10 -translate-x-1/2" },
  { id: "mcgregor", label: "McGregor", mirror: true, tilt: "rotate-[7deg] translate-x-1/2 translate-y-6" },
];

const CLASSIC_FACES = ["islam", "pereira", "topuria", "ngannou", "chimaev"];
const GOAT_SLICES = ["jones", "khabib", "silva", "holloway"];

function Photo({
  id,
  className = "",
  imgClassName = "",
  sizes,
}: {
  id: string;
  className?: string;
  imgClassName?: string;
  sizes: string;
}) {
  const src = fighterImage(id);
  if (!src) return <div className={`bg-zinc-800 ${className}`} />;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt="" fill sizes={sizes} className={`object-cover object-top ${imgClassName}`} />
    </div>
  );
}

function HandCard({
  id,
  label,
  tilt,
  mirror = false,
}: {
  id: string;
  label?: string;
  tilt: string;
  /** right-hand card: name on the right so the card in front never covers it */
  mirror?: boolean;
}) {
  const f = getFighter(id);
  const rating = Math.round(ovr(f));
  return (
    // Hover: the card straightens, lifts to the front and comes into full color;
    // the rest of the hand dims (group/hand is on the container).
    <div
      className={`group/card absolute left-1/2 top-0 w-28 overflow-hidden rounded-md bg-zinc-950 shadow-2xl shadow-black/80 transition duration-300 ease-out hover:z-20 hover:-translate-y-4 hover:rotate-0 hover:scale-[1.06] group-has-hover/hand:not-hover:opacity-55 sm:w-40 ${
        f.isMythic
          ? "ring-2 ring-violet-500 hover:shadow-[0_24px_50px_-12px_rgba(168,85,247,0.65)]"
          : "ring-1 ring-white/15 hover:ring-fight/70 hover:shadow-[0_24px_50px_-12px_rgba(224,40,46,0.55)]"
      } ${tilt}`}
    >
      <Photo
        id={id}
        sizes="160px"
        className="aspect-[4/5] w-full grayscale-[35%] transition duration-300 group-hover/card:grayscale-0"
        imgClassName="transition-transform duration-500 ease-out group-hover/card:scale-110"
      />
      <div
        className={`flex items-center justify-between gap-2 border-t border-white/10 px-2.5 py-2 ${
          mirror ? "flex-row-reverse text-right" : ""
        }`}
      >
        <div className="min-w-0">
          {f.isMythic && (
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-400">
              Mythic{f.nickname ? ` · ${f.nickname}` : ""}
            </p>
          )}
          <p className="font-display text-sm leading-none text-white sm:text-base">
            {label ?? f.name}
          </p>
        </div>
        <span className={`font-mono text-lg font-bold tabular-nums ${ratingText(rating)}`}>{rating}</span>
      </div>
    </div>
  );
}

export default async function Home() {
  const t = await getT();
  const h = t.home;

  const modes = [
    {
      href: "/play",
      record: "30-0",
      name: h.classicName,
      line: h.classicLine,
      meta: h.classicMeta,
      bestKey: "cyg300:best",
      art: (
        <div className="flex h-full gap-px">
          {CLASSIC_FACES.map((id) => (
            <Photo key={id} id={id} sizes="120px" className="h-full flex-1" />
          ))}
        </div>
      ),
    },
    {
      href: "/goat",
      record: "13-0",
      name: h.goatName,
      line: h.goatLine,
      meta: h.goatMeta,
      bestKey: "goat:best",
      // Four legends cut into strips — you stitch one fighter out of many.
      art: (
        <div className="flex h-full">
          {GOAT_SLICES.map((id, i) => (
            <Photo
              key={id}
              id={id}
              sizes="160px"
              className={`h-full flex-1 ${i > 0 ? "border-l-2 border-dashed border-black/70" : ""}`}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-14 pt-8 sm:pt-14">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-[3.6rem] leading-[0.86] text-white sm:text-[5.5rem]">
            {h.headA} <span className="text-fight">30-0</span>
            {h.headB}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400 sm:text-lg">{h.sub}</p>
        </div>

        <div className="group/hand relative mx-auto h-52 w-full max-w-md sm:h-72" aria-hidden>
          {HAND.map((c) => (
            <SfxZone key={c.id} hover="deal">
              <HandCard {...c} />
            </SfxZone>
          ))}
        </div>
      </section>

      {/* Modes */}
      <section className="mt-14 sm:mt-16">
        <h2 className="mb-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
          {h.pickGame}
          <span className="h-px flex-1 bg-white/10" aria-hidden />
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {modes.map((m) => (
            <SfxZone key={m.href} hover="hover" click="bell">
              <Link
                href={m.href}
                className="group overflow-hidden rounded-lg bg-zinc-950/90 ring-1 ring-white/10 transition hover:ring-fight/60"
              >
                <div className="relative h-36 overflow-hidden grayscale transition duration-300 group-hover:grayscale-0 sm:h-40">
                  {m.art}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                  <span className="font-display absolute bottom-1 left-4 text-6xl leading-none text-cream tabular-nums sm:text-7xl">
                    {m.record}
                  </span>
                  <span className="absolute right-3 top-3">
                    <PersonalBest storageKey={m.bestKey} label={h.yourBest} />
                  </span>
                </div>

                <div className="p-4 pt-3 sm:p-5 sm:pt-3">
                  <h3 className="font-display text-2xl text-white">{m.name}</h3>
                  <p className="mt-0.5 text-sm text-zinc-400">{m.line}</p>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    {m.meta.join("  /  ")}
                  </p>
                  <span className="btn-fight mt-4 w-full py-3 text-sm">
                    {h.play}
                    <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </SfxZone>
          ))}
        </div>
      </section>

      {/* How a season works */}
      <section className="mt-14 border-t border-white/10 pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl text-white">{h.howTitle}</h2>
          <Link
            href="/leaderboard"
            className="text-xs font-bold uppercase tracking-wider text-zinc-400 underline decoration-fight decoration-2 underline-offset-4 hover:text-white"
          >
            {h.board} →
          </Link>
        </div>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {h.steps.map((s, i) => (
            <li key={s.k} className="flex gap-3">
              <span className="font-mono text-sm font-bold text-fight tabular-nums">0{i + 1}</span>
              <div>
                <p className="font-display text-lg leading-none text-white">{s.k}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.v}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
