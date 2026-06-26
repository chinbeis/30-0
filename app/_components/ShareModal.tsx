"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/I18nProvider";

const enc = encodeURIComponent;

// Client-only flag without setState-in-effect: server snapshot is false, client
// snapshot is true, so we render the portal only after hydration.
const emptySubscribe = () => () => {};

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
    label: "X",
    className: "bg-zinc-100 text-black hover:bg-white",
    glyph: "𝕏",
    href: (u, t) => `https://twitter.com/intent/tweet?text=${enc(t)}&url=${enc(u)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    className: "bg-green-600 text-white hover:bg-green-500",
    glyph: "✆",
    href: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    className: "bg-sky-600 text-white hover:bg-sky-500",
    glyph: "✈",
    href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    className: "bg-blue-600 text-white hover:bg-blue-500",
    glyph: "f",
    // Facebook's sharer ignores pre-filled text and composes the post from the
    // URL's Open Graph card. `quote` is best-effort; we also copy the caption to
    // the clipboard on click (see onClick) so the user can paste it.
    href: (u, t) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}&quote=${enc(t)}`,
  },
  {
    key: "reddit",
    label: "Reddit",
    className: "bg-orange-600 text-white hover:bg-orange-500",
    glyph: "r/",
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
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fbHint, setFbHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Derived (not stored): only read after mount so SSR and hydration stay aligned.
  const canNativeShare =
    mounted && typeof navigator !== "undefined" && typeof navigator.share === "function";

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

  // Move focus into the dialog so Escape/Tab behave and screen readers announce it.
  useEffect(() => {
    if (mounted) panelRef.current?.focus();
  }, [mounted]);

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked (e.g. insecure context) — select the text so the user can copy manually
      inputRef.current?.select();
    }
  };

  const onNativeShare = async () => {
    if (!url) return;
    try {
      await navigator.share({ title, text, url });
    } catch {
      // user dismissed the sheet, or share unsupported — no-op
    }
  };

  if (!mounted) return null;

  const ready = url !== null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div
        className="animate-fade absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-pop relative z-10 my-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="-mr-1 rounded-full p-1.5 text-lg leading-none text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
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

        {/* share link + inline copy */}
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-800 bg-black px-3 py-2">
          {ready ? (
            <input
              ref={inputRef}
              readOnly
              value={url as string}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 truncate bg-transparent text-xs text-zinc-400 outline-none"
            />
          ) : (
            <span className="flex min-w-0 flex-1 items-center gap-2 text-xs text-zinc-500">
              <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
              {t.common.preparingLink}
            </span>
          )}
          <button
            onClick={onCopy}
            disabled={!ready}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition disabled:opacity-40 ${
              copied
                ? "bg-emerald-500/20 text-emerald-300"
                : "border border-zinc-700 text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            {copied ? t.common.copied : t.common.copyLink}
          </button>
        </div>

        {/* native share sheet — best on mobile (only shown when supported) */}
        {canNativeShare ? (
          <button
            onClick={onNativeShare}
            disabled={!ready}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-red-500 py-3 text-sm font-black text-black transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            ↗ {t.common.share}
          </button>
        ) : null}

        {/* social buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {PLATFORMS.map((p) => (
            <a
              key={p.key}
              href={ready ? p.href(url as string, text) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!ready}
              onClick={(e) => {
                if (!ready) {
                  e.preventDefault();
                  return;
                }
                // Facebook ignores pre-filled text, so copy the caption for pasting.
                if (p.key === "facebook") {
                  navigator.clipboard?.writeText(text).catch(() => {});
                  setFbHint(true);
                  window.setTimeout(() => setFbHint(false), 7000);
                }
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition active:scale-[0.97] ${p.className} ${
                ready ? "" : "pointer-events-none opacity-50"
              }`}
            >
              <span className="text-base font-black" aria-hidden>
                {p.glyph}
              </span>
              {p.label}
            </a>
          ))}
        </div>

        {/* Facebook can't accept pre-filled text — tell the user we copied it. */}
        {fbHint ? (
          <p className="mt-2.5 text-center text-[11px] leading-relaxed text-zinc-500">
            {t.common.fbCaption}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
