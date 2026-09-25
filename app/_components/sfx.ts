// Game sound effects — synthesized live with the Web Audio API, so there are no
// audio files to license, download or cache. Every sound is a few oscillators
// and filtered noise bursts.
//
// Browsers block audio until the first user gesture, so the AudioContext is
// unlocked on the visitor's first pointerdown/keydown anywhere on the site. Until
// then (and whenever the context isn't running) sounds are skipped, not queued,
// so nothing bursts out at once when audio starts.
//
// Mute state persists in localStorage (`sfx:muted`); SoundToggle subscribes to it.

import { useEffect } from "react";

const MUTE_KEY = "sfx:muted";
/** Overall level. Kept low on purpose: this is a game people play at work. */
const MASTER_VOLUME = 0.15;

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = readMuted();
const listeners = new Set<() => void>();

function readMuted(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribeMuted(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function audio(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = MASTER_VOLUME;
    // Soft limiter so stacked sounds (a loss landing on a tick) never clip.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    out.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  // Still waking up inside a click (resume is async)? Schedule anyway — it plays
  // the moment the context starts. Outside a gesture, skip instead of queueing.
  const live = ctx.state === "running" || (navigator.userActivation?.isActive ?? true);
  return live ? ctx : null;
}

/** Create + resume the context inside a real user gesture (required by Chrome and
 *  iOS Safari). A 1-sample silent buffer finishes the unlock on iOS. */
function unlock(): void {
  const c = audio() ?? ctx;
  if (!c) return;
  void c.resume().then(() => {
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, c.sampleRate);
    src.connect(c.destination);
    src.start();
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
}

type ToneOpts = {
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  attack?: number;
  /** glide to this frequency over the tone's duration */
  to?: number;
};

function tone(freq: number, dur: number, o: ToneOpts = {}): void {
  const c = audio();
  if (!c || !out) return;
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  const peak = o.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

type NoiseOpts = {
  filter?: BiquadFilterType;
  freq?: number;
  to?: number;
  q?: number;
  gain?: number;
  delay?: number;
  attack?: number;
};

function noise(dur: number, o: NoiseOpts = {}): void {
  const c = audio();
  if (!c || !out) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = c.currentTime + (o.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = o.filter ?? "bandpass";
  f.frequency.setValueAtTime(o.freq ?? 1000, t0);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t0 + (o.attack ?? 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + dur + 0.05);
}

/** Boxing bell: inharmonic metal partials with a long ring. */
function bellStrike(delay = 0, gain = 0.22): void {
  const base = 830;
  [1, 2.32, 4.25, 6.63].forEach((m, i) =>
    tone(base * m, 1.6 - i * 0.3, { gain: gain / (i + 1), delay, attack: 0.002 }),
  );
  noise(0.05, { filter: "highpass", freq: 3000, gain: 0.12, delay });
}

export const sfx = {
  /** Barely-there tick when the pointer lands on a card. */
  hover() {
    noise(0.025, { filter: "highpass", freq: 4000, gain: 0.05 });
  },
  /** UI button tap. */
  tap() {
    noise(0.03, { freq: 2200, q: 2, gain: 0.14 });
    tone(900, 0.05, { gain: 0.05 });
  },
  /** Cards sliding onto the table, spaced to match the 70ms deal animation. */
  deal(count = 3) {
    for (let i = 0; i < count; i++)
      noise(0.09, { freq: 700, to: 3200, q: 1.2, gain: 0.14, delay: i * 0.07 });
  },
  /** Locking in a pick: a glove landing on the pads. */
  pick() {
    tone(170, 0.22, { to: 45, gain: 0.45 });
    noise(0.07, { filter: "lowpass", freq: 1400, gain: 0.2 });
  },
  /** Dice rattle for a reroll. */
  reroll() {
    for (let i = 0; i < 6; i++)
      noise(0.025, { freq: 2500 + Math.random() * 2200, q: 6, gain: 0.22, delay: i * 0.045 + Math.random() * 0.015 });
  },
  /** A PRIME (gold) card was dealt. */
  prime() {
    tone(1047, 0.5, { type: "triangle", gain: 0.1, delay: 0.12 });
    tone(1568, 0.7, { type: "triangle", gain: 0.08, delay: 0.2 });
  },
  /** A MYTHIC card was dealt: a rising sparkle. */
  mythic() {
    [659, 831, 988, 1319, 1661].forEach((f, i) =>
      tone(f, 0.6, { type: "triangle", gain: 0.1, delay: 0.12 + i * 0.07 }),
    );
    noise(0.8, { filter: "highpass", freq: 6000, gain: 0.05, delay: 0.12, attack: 0.2 });
  },
  /** Opening bell. `times` = 2 for the classic "ding-ding". */
  bell(times = 1) {
    for (let i = 0; i < times; i++) bellStrike(i * 0.26);
  },
  /** A win on the season tape. Pitch climbs with the streak, so the tension builds. */
  win(streak: number) {
    const f = 440 * Math.pow(2, Math.min(streak, 30) / 24);
    tone(f, 0.09, { type: "triangle", gain: 0.12 });
    noise(0.03, { filter: "lowpass", freq: 1800, gain: 0.12 });
  },
  /** A loss lands: heavy low impact. */
  loss() {
    tone(95, 0.55, { to: 32, gain: 0.5 });
    tone(116, 0.35, { type: "sawtooth", gain: 0.06 });
    noise(0.3, { filter: "lowpass", freq: 900, gain: 0.28 });
  },
  /** Crowd swell as the title run begins. */
  crowd() {
    noise(1.6, { freq: 500, to: 1200, q: 0.6, gain: 0.14, attack: 0.5 });
    noise(1.4, { freq: 2200, q: 0.8, gain: 0.05, attack: 0.6, delay: 0.1 });
  },
  /** Perfect record: fanfare plus a double bell. */
  perfect() {
    [523, 659, 784].forEach((f, i) => tone(f, 0.35, { type: "triangle", gain: 0.16, delay: i * 0.12 }));
    [523, 659, 784, 1047].forEach((f) => tone(f, 1.3, { type: "triangle", gain: 0.1, delay: 0.38 }));
    bellStrike(0.38, 0.14);
    bellStrike(0.64, 0.14);
    noise(1.8, { freq: 700, to: 1400, q: 0.6, gain: 0.12, attack: 0.4, delay: 0.3 });
  },
  /** One away: the sad trombone. This is the "run it back" moment. */
  nearMiss() {
    [392, 370, 349].forEach((f, i) => tone(f, 0.28, { type: "triangle", gain: 0.14, delay: i * 0.26 }));
    tone(330, 0.9, { type: "triangle", gain: 0.14, delay: 0.78, to: 290 });
  },
  /** A regular losing season: the final bell. */
  final() {
    bellStrike(0, 0.18);
  },
};

// ---------------------------------------------------------------------------
// React glue. Sounds are fired from timers/handlers, never directly in an
// effect body, so React strict mode's double-mount in dev doesn't double them
// (the first mount's timer is cleared on cleanup).
// ---------------------------------------------------------------------------

/** Deal sound when a hand of cards appears; sparkle if it holds a prime/mythic. */
export function useDealSound(count: number, hasPrime: boolean, hasMythic: boolean, key: unknown): void {
  useEffect(() => {
    const id = setTimeout(() => {
      sfx.deal(count);
      if (hasMythic) sfx.mythic();
      else if (hasPrime) sfx.prime();
    }, 0);
    return () => clearTimeout(id);
  }, [count, hasPrime, hasMythic, key]);
}

/** Final sound for a finished run: perfect / one away / regular. */
export function useOutcomeSound(losses: number, nearMiss: boolean): void {
  useEffect(() => {
    const id = setTimeout(() => {
      if (losses === 0) sfx.perfect();
      else if (nearMiss) sfx.nearMiss();
      else sfx.final();
    }, 0);
    return () => clearTimeout(id);
  }, [losses, nearMiss]);
}
