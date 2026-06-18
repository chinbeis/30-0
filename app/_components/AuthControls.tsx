"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";

type User = { name: string | null; image: string | null } | null;

export function AuthControls({ user, googleEnabled }: { user: User; googleEnabled: boolean }) {
  const [open, setOpen] = useState(false);

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.image ? (
          <Image src={user.image} alt={user.name ?? "You"} width={26} height={26} className="rounded-full" />
        ) : null}
        <button
          onClick={() => signOut()}
          className="text-zinc-500 transition hover:text-white"
          title="Sign out"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black transition hover:bg-zinc-200"
      >
        Sign in
      </button>
      {open ? <LoginModal googleEnabled={googleEnabled} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function LoginModal({ googleEnabled, onClose }: { googleEnabled: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
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

  if (!mounted) return null;

  // Portal to <body> so the header's `backdrop-blur` (a containing block for
  // fixed elements) can't break centering / full-screen coverage on mobile.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 text-lg leading-none text-zinc-500 transition hover:text-white"
        >
          ✕
        </button>

        <div className="text-3xl" aria-hidden>
          🥊
        </div>
        <h2 className="mt-2 text-xl font-black tracking-tight">Sign in</h2>
        <p className="mt-1 text-sm text-zinc-400">Save your scores and climb the leaderboard.</p>

        {googleEnabled ? (
          <button
            onClick={() => signIn("google")}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 font-bold text-black transition hover:bg-zinc-200"
          >
            <GoogleG /> Continue with Google
          </button>
        ) : (
          <p className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">
            Google sign-in isn’t set up yet. You can still play — your scores save
            under a nickname after a game.
          </p>
        )}

        <p className="mt-4 text-xs text-zinc-600">No account needed to play.</p>
      </div>
    </div>,
    document.body,
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C41.4 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
