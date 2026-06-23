"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/I18nProvider";

const enc = encodeURIComponent;

type Platform = {
  key: string;
  label: string;
  className: string;
  glyph: string;
  href: (url: string, text: string) => string;
};

// X/Twitter, Facebook, WhatsApp, Telegram, Reddit — official web share intents.
const PLATFORMS: Platform[] = [
  {
    key: "x",
    label: "X / Twitter",
    className: "bg-sky-500 hover:bg-sky-400",
    glyph: "𝕏",
    href: (u, t) => `https://twitter.com/intent/tweet?text=${enc(t)}&url=${enc(u)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    className: "bg-blue-600 hover:bg-blue-500",
    glyph: "f",
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    className: "bg-green-600 hover:bg-green-500",
    glyph: "✆",
    href: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    className: "bg-sky-600 hover:bg-sky-500",
    glyph: "✈",
    href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}`,
  },
  {
    key: "reddit",
    label: "Reddit",
    className: "bg-orange-600 hover:bg-orange-500",
    glyph: "👽",
    href: (u, t) => `https://www.reddit.com/submit?url=${enc(u)}&title=${enc(t)}`,
  },
];

export function ShareModal({
  title,
  text,
  getShareUrl,
  fallbackUrl,
  preview,
  onClose,
}: {
  title: string;
  /** Brag line WITHOUT the url (the url is appended/passed per platform). */
  text: string;
  /** Mints the shareable link (e.g. a challenge link). Null → use fallbackUrl. */
  getShareUrl: () => Promise<string | null>;
  fallbackUrl: string;
  preview: React.ReactNode;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    getShareUrl()
      .then((u) => alive && setUrl(u ?? fallbackUrl))
      .catch(() => alive && setUrl(fallbackUrl));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  if (!mounted) return null;

  const ready = url !== null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 my-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="text-lg leading-none text-zinc-500 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* preview card (the fighters) */}
        <div className="mt-4">{preview}</div>

        {/* brag text */}
        <p className="mt-4 whitespace-pre-line rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300">
          {text}
        </p>

        {/* share link */}
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-800 bg-black px-3 py-2">
          <input
            readOnly
            value={ready ? (url as string) : "…"}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 truncate bg-transparent text-xs text-zinc-400 outline-none"
          />
        </div>

        {/* social buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {PLATFORMS.map((p) => (
            <a
              key={p.key}
              href={ready ? p.href(url as string, text) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!ready}
              onClick={(e) => !ready && e.preventDefault()}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 text-sm font-bold text-white transition ${p.className} ${
                ready ? "" : "pointer-events-none opacity-50"
              }`}
            >
              <span className="text-base" aria-hidden>
                {p.glyph}
              </span>
              {p.label}
            </a>
          ))}
        </div>

        {/* copy link */}
        <button
          onClick={onCopy}
          disabled={!ready}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
        >
          🔗 {copied ? t.common.copied : t.common.copyLink}
        </button>
      </div>
    </div>,
    document.body,
  );
}
