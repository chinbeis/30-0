import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { playerStats, recentRuns } from "@/lib/queries";
import { getLocale, getT } from "@/lib/i18n/server";
import { recordAccent } from "../_game/helpers";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = {
  title: "Your Profile · Can You Go 30-0?",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const user = session.user;
  const email = session.user.email; // narrowed to string by the guard above
  const source = user.provider === "google" ? "google" : "email";
  const playerKey = `${source}:${email}`;

  const t = await getT();
  const locale = await getLocale();
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const [stats, recent] = await Promise.all([playerStats(playerKey), recentRuns(playerKey, 12)]);

  const name = user.name?.trim() || email.split("@")[0];
  const initial = name.slice(0, 1).toUpperCase();
  const bestRecord = stats.bestWins != null ? `${stats.bestWins}-${stats.bestLosses}` : "N/A";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-zinc-400 transition hover:text-white">
          {t.profile.back}
        </Link>
        <SignOutButton />
      </div>

      <h1 className="text-3xl font-black tracking-tight">{t.profile.title}</h1>

      {/* Profile card */}
      <div className="mt-5 rounded-3xl border border-amber-500/40 bg-gradient-to-b from-zinc-900 to-black p-5">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image src={user.image} alt={name} width={56} height={56} className="rounded-full" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/80 text-xl font-black text-black">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate text-xl font-black">{name}</div>
            <div className="truncate text-sm text-zinc-500">{email}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon="🏆" value={String(stats.gamesPlayed)} label={t.profile.gamesPlayed} />
          <StatCard icon="📈" value={stats.bestScore != null ? String(stats.bestScore) : "N/A"} label={t.profile.bestScore} />
          <StatCard icon="🕑" value={bestRecord} label={t.profile.bestRecord} />
        </div>
      </div>

      {/* Recent games */}
      <h2 className="mt-8 text-2xl font-black tracking-tight">{t.profile.recentGames}</h2>

      {recent.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
          <p className="text-zinc-400">{t.profile.noGames}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-8 py-3 font-black text-black transition hover:scale-105"
          >
            {t.profile.playNow}
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {recent.map((r, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-black text-amber-300">
                {r.tier.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black uppercase tracking-wide text-sky-400">
                  {r.tier}
                </div>
                <div className="text-xs text-zinc-500">
                  {r.game === "goat" ? t.profile.modeGoat : t.profile.mode30}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-black tabular-nums ${recordAccent(r.losses)}`}>
                  {r.wins}-{r.losses}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {t.profile.score}: {r.goatScore}
                </div>
                <div className="text-[11px] text-zinc-600">{dateFmt.format(new Date(r.createdAt))}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate text-lg font-black">{value}</div>
        <div className="truncate text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}
