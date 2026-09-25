"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getFighter } from "@/lib/game/fighters";
import { ovr } from "@/lib/game/engine";
import type { Fighter } from "@/lib/game/types";
import { fighterImage, fighterTags, isLiabilityTag, styleLean } from "../_game/helpers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ratingFill, ratingText } from "./ratings";
import { sfx } from "./sfx";

export type HandSlot = {
  id: string;
  /** short name for the small card */
  label?: string;
  /** tilt/offset classes that fan the card out */
  tilt: string;
  /** right-hand card: name on the right so the card in front never covers it */
  mirror?: boolean;
};

const STAT_KEYS = ["striking", "grappling", "finishing", "cardio", "durability", "fightIq", "experience"] as const;

function Photo({
  id,
  name,
  className = "",
  imgClassName = "",
  sizes,
  preload = false,
  focus = "object-top",
}: {
  id: string;
  name: string;
  className?: string;
  imgClassName?: string;
  sizes: string;
  preload?: boolean;
  /** object-position class; the tall sheet crop needs to sit lower than the card's */
  focus?: string;
}) {
  const src = fighterImage(id);
  if (!src) return <div className={`bg-zinc-800 ${className}`} />;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt={name} fill sizes={sizes} preload={preload} className={`object-cover ${focus} ${imgClassName}`} />
    </div>
  );
}

/** The fanned "dealt hand" in the home hero. Press a card to inspect it. */
export function HeroHand({ slots }: { slots: HandSlot[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  const fighters = useMemo(() => slots.map((s) => getFighter(s.id)), [slots]);

  const show = useCallback(
    (i: number) => {
      setOpen(i);
      sfx.deal(1);
      if (fighters[i].isMythic) sfx.mythic();
      else if (fighters[i].isPrime) sfx.prime();
    },
    [fighters],
  );

  return (
    <>
      <div className="group/hand relative mx-auto h-52 w-full max-w-md sm:h-72">
        {slots.map((s, i) => (
          <HandCard key={s.id} slot={s} fighter={fighters[i]} label={t.home.viewStats} onPress={() => show(i)} />
        ))}
        <p className="pointer-events-none absolute inset-x-0 -bottom-6 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 sm:-bottom-2">
          {t.home.tapHint}
        </p>
      </div>

      {open !== null && (
        <FighterSheet
          fighter={fighters[open]}
          onClose={() => {
            setOpen(null);
            sfx.tap();
          }}
          onStep={(d) => show((open + d + slots.length) % slots.length)}
        />
      )}
    </>
  );
}

function HandCard({
  slot,
  fighter: f,
  label,
  onPress,
}: {
  slot: HandSlot;
  fighter: Fighter;
  label: string;
  onPress: () => void;
}) {
  const rating = Math.round(ovr(f));
  return (
    // Hover: the card straightens, lifts to the front and comes into full color;
    // the rest of the hand dims. Press opens the stats sheet.
    <button
      type="button"
      onClick={onPress}
      onPointerEnter={(e) => e.pointerType === "mouse" && sfx.deal(1)}
      aria-label={`${label}: ${f.name}`}
      className={`group/card absolute left-1/2 top-0 w-28 cursor-pointer overflow-hidden rounded-md bg-zinc-950 text-left shadow-2xl shadow-black/80 transition duration-300 ease-out hover:z-20 hover:-translate-y-4 hover:rotate-0 hover:scale-[1.06] focus-visible:z-20 active:scale-[1.02] group-has-hover/hand:not-hover:opacity-55 sm:w-40 ${
        f.isMythic
          ? "ring-2 ring-violet-500 hover:shadow-[0_24px_50px_-12px_rgba(168,85,247,0.65)]"
          : "ring-1 ring-white/15 hover:ring-fight/70 hover:shadow-[0_24px_50px_-12px_rgba(224,40,46,0.55)]"
      } ${slot.tilt}`}
    >
      <Photo
        id={f.id}
        name=""
        sizes="160px"
        className="aspect-[4/5] w-full grayscale-[35%] transition duration-300 group-hover/card:grayscale-0"
        imgClassName="transition-transform duration-500 ease-out group-hover/card:scale-110"
      />
      <div
        className={`flex items-center justify-between gap-2 border-t border-white/10 px-2.5 py-2 ${
          slot.mirror ? "flex-row-reverse text-right" : ""
        }`}
      >
        <div className="min-w-0">
          {f.isMythic && (
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-400">
              Mythic{f.nickname ? ` · ${f.nickname}` : ""}
            </p>
          )}
          <p className="font-display text-sm leading-none text-white sm:text-base">{slot.label ?? f.name}</p>
        </div>
        <span className={`font-mono text-lg font-bold tabular-nums ${ratingText(rating)}`}>{rating}</span>
      </div>
    </button>
  );
}

/** Zoomed-in card: photo, OVR, tags and all seven ratings. */
function FighterSheet({
  fighter: f,
  onClose,
  onStep,
}: {
  fighter: Fighter;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const { t } = useI18n();
  const h = t.home;
  const closeRef = useRef<HTMLButtonElement>(null);
  const rating = Math.round(ovr(f));
  const mythic = !!f.isMythic;

  // Latest handlers in refs so the key/scroll-lock effect runs once per open,
  // not on every flip.
  const handlers = useRef({ onClose, onStep });
  useEffect(() => {
    handlers.current = { onClose, onStep };
  }, [onClose, onStep]);

  // Esc closes, arrows flip through the hand; lock page scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handlers.current.onClose();
      else if (e.key === "ArrowRight") handlers.current.onStep(1);
      else if (e.key === "ArrowLeft") handlers.current.onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const arrow = "flex h-10 w-10 items-center justify-center rounded-md bg-white/5 text-lg text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white";

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={f.name}
        onClick={(e) => e.stopPropagation()}
        key={f.id}
        className={`animate-pop max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-zinc-950 ${
          mythic ? "ring-2 ring-violet-500 shadow-[0_0_60px_-10px_rgba(168,85,247,0.6)]" : "ring-1 ring-white/15"
        }`}
      >
        {/* photo header */}
        <div className="relative">
          <Photo id={f.id} name={f.name} sizes="384px" preload focus="object-[center_35%]" className="aspect-square w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={h.close}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-zinc-300 ring-1 ring-white/15 transition hover:text-white"
          >
            ✕
          </button>
          {mythic && (
            <span className="absolute left-3 top-3 rounded-sm bg-violet-500 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              Mythic
            </span>
          )}
          <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-3xl leading-[0.9] text-white sm:text-4xl">{f.name}</h3>
              {f.nickname && <p className="mt-1 truncate text-sm italic text-zinc-400">&ldquo;{f.nickname}&rdquo;</p>}
            </div>
            <div className="shrink-0 text-center leading-none">
              <span className={`font-mono text-5xl font-bold tabular-nums ${ratingText(rating)}`}>{rating}</span>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500">OVR</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 pt-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            {f.division} / {f.era} / {h.styles[styleLean(f)]}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {fighterTags(f).map((tag) => (
              <span
                key={tag}
                className={`rounded-sm px-2 py-0.5 text-[11px] font-bold ${
                  isLiabilityTag(tag) ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>

          <ul className="mt-4 space-y-2.5">
            {STAT_KEYS.map((k, i) => {
              const v = f[k];
              // same 50→100 scale as the draft cards, so 82 vs 90 is visible
              const w = Math.max(4, Math.min(100, ((v - 50) / 50) * 100));
              return (
                <li key={k} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-400">{h.stat[k]}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`animate-bar h-full origin-left rounded-full ${ratingFill(v)}`}
                      style={{ width: `${w}%`, animationDelay: `${i * 40}ms` }}
                    />
                  </div>
                  <span className={`text-right font-mono text-sm font-bold tabular-nums ${ratingText(v)}`}>{v}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex items-center gap-2">
            <button type="button" onClick={() => onStep(-1)} aria-label={h.prev} className={arrow}>
              ←
            </button>
            <Link href="/play" onClick={() => sfx.bell(2)} className="btn-fight h-10 flex-1 text-sm">
              {h.draftCta} →
            </Link>
            <button type="button" onClick={() => onStep(1)} aria-label={h.next} className={arrow}>
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
