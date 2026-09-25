"use client";

import { useSyncExternalStore } from "react";
import { isMuted, setMuted, sfx, subscribeMuted } from "./sfx";

// Header speaker button. Server snapshot = unmuted, so the icon may flip once
// after hydration for someone who muted on a previous visit.
export function SoundToggle({ labelOn, labelOff }: { labelOn: string; labelOff: string }) {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);

  return (
    <button
      type="button"
      onClick={() => {
        setMuted(!muted);
        if (muted) sfx.tap(); // just unmuted: confirm with a sound
      }}
      aria-pressed={!muted}
      aria-label={muted ? labelOff : labelOn}
      title={muted ? labelOff : labelOn}
      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/5 hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
        {muted ? (
          <path d="m23 9-6 6M17 9l6 6" />
        ) : (
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
        )}
      </svg>
    </button>
  );
}
