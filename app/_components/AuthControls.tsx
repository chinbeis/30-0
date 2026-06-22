"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type User = { name: string | null; image: string | null } | null;

export function AuthControls({ user, googleEnabled }: { user: User; googleEnabled: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (user) {
    const label = user.name?.trim().split(/\s+/)[0] || t.nav.profile;
    const initial = (user.name?.trim() || "U").slice(0, 1).toUpperCase();
    return (
      <Link
        href="/profile"
        title={t.nav.profile}
        className="flex shrink-0 items-center gap-1.5 text-zinc-300 transition hover:text-white"
      >
        {user.image ? (
          <Image src={user.image} alt={label} width={26} height={26} className="rounded-full" />
        ) : (
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-amber-500/80 text-xs font-bold text-black">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[8rem] truncate sm:inline">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-black transition hover:bg-zinc-200"
      >
        {t.nav.signIn}
      </button>
      {open ? <LoginModal googleEnabled={googleEnabled} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function LoginModal({ googleEnabled, onClose }: { googleEnabled: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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

  const finish = () => {
    onClose();
    router.refresh(); // re-render the header (and pages) as signed-in
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError(t.login.errFields);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || t.login.errGeneric);
          setBusy(false);
          return;
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError(t.login.errInvalid);
        setBusy(false);
        return;
      }
      finish();
    } catch {
      setError(t.login.errGeneric);
      setBusy(false);
    }
  };

  if (!mounted) return null;

  const isSignup = mode === "signup";

  // Portal to <body> so the header's backdrop-blur can't break centering on mobile.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isSignup ? t.login.signUpTitle : t.login.signInTitle}
        className="relative z-10 my-auto w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute right-3 top-3 text-lg leading-none text-zinc-500 transition hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-black tracking-tight">
          {isSignup ? t.login.signUpTitle : t.login.signInTitle}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {isSignup ? t.login.signUpSub : t.login.signInSub}
        </p>

        {googleEnabled ? (
          <button
            onClick={() => signIn("google")}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-bold text-white transition hover:bg-zinc-800"
          >
            <GoogleG /> {t.login.continueGoogle}
          </button>
        ) : (
          <p className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">
            {t.login.googleDisabled}
          </p>
        )}

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-zinc-800" />
          <span className="text-[10px] font-bold tracking-widest text-zinc-600">{t.login.orEmail}</span>
          <span className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {isSignup ? (
            <div>
              <label className="mb-1 block text-sm font-semibold">{t.login.nameLabel}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                placeholder={t.login.namePlaceholder}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-400"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-semibold">{t.login.emailLabel}</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-400"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-semibold">{t.login.passwordLabel}</label>
              {!isSignup ? (
                <button
                  type="button"
                  onClick={() => setInfo(t.login.forgotMsg)}
                  className="text-xs text-zinc-400 transition hover:text-white"
                >
                  {t.login.forgot}
                </button>
              ) : null}
            </div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.login.passwordPlaceholder}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 pr-10 text-sm outline-none transition focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? t.login.hide : t.login.show}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 text-zinc-500 transition hover:text-white"
              >
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {info ? <p className="text-sm text-amber-300">{info}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {busy ? t.login.working : isSignup ? t.login.signUpBtn : t.login.signInBtn}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          {isSignup ? t.login.haveAccount : t.login.noAccount}{" "}
          <button
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError(null);
              setInfo(null);
            }}
            className="font-bold text-white underline-offset-4 hover:underline"
          >
            {isSignup ? t.login.signInLink : t.login.signUpLink}
          </button>
        </p>
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
