"use client";

import Image from "next/image";
import { useState } from "react";
import { avatarColor, fighterImage, initials } from "./helpers";

/**
 * Round fighter avatar. Renders the real (free-licensed) photo when available,
 * and gracefully falls back to an initials monogram on missing photo or load error
 * — so the UI never shows a broken image.
 *
 * `className` controls size + shape (pass e.g. "h-14 w-14 rounded-full").
 */
export function FighterAvatar({
  id,
  name,
  className = "",
  imgClassName = "",
  textClass = "text-base",
  title,
  sizes = "64px",
}: {
  id: string;
  name: string;
  className?: string;
  /** appended to the inner photo <Image> (e.g. a group-hover zoom) */
  imgClassName?: string;
  textClass?: string;
  title?: string;
  sizes?: string;
}) {
  const [errored, setErrored] = useState(false);
  const src = fighterImage(id);
  const showPhoto = src && !errored;

  return (
    <div
      title={title ?? name}
      className={`relative flex-none overflow-hidden ${showPhoto ? "bg-zinc-800" : avatarColor(id)} ${className}`}
    >
      {showPhoto ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          className={`object-cover object-top ${imgClassName}`}
          onError={() => setErrored(true)}
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-black text-white ${textClass}`}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
