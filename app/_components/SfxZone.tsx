"use client";

import { sfx } from "./sfx";

type Sound = "hover" | "tap" | "bell" | "deal";

const play: Record<Sound, () => void> = {
  hover: () => sfx.hover(),
  tap: () => sfx.tap(),
  bell: () => sfx.bell(2),
  deal: () => sfx.deal(1),
};

// Adds sound to server-rendered markup without turning it into a client
// component. Renders `display: contents`, so it doesn't affect layout; pointer
// events still bubble up through it.
export function SfxZone({
  hover,
  click,
  children,
}: {
  hover?: Sound;
  click?: Sound;
  children: React.ReactNode;
}) {
  return (
    <div
      className="contents"
      onPointerEnter={hover ? (e) => e.pointerType === "mouse" && play[hover]() : undefined}
      onClick={click ? () => play[click]() : undefined}
    >
      {children}
    </div>
  );
}
