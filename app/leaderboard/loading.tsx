import { LeaderboardListSkeleton } from "./skeletons";

// Instant route-level fallback (prefetched by Next), shown the moment you
// navigate to /leaderboard while the live query runs.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <div className="flex items-end justify-between gap-4">
        <div className="h-12 w-56 animate-pulse rounded bg-zinc-800 sm:h-14" />
        <div className="h-10 w-32 animate-pulse rounded-md bg-zinc-900" />
      </div>
      <div className="mt-5 h-8 border-b border-white/10" />
      <LeaderboardListSkeleton />
    </main>
  );
}
