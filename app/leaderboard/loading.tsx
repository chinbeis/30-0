import { LeaderboardListSkeleton } from "./skeletons";

// Instant route-level fallback (prefetched by Next), shown the moment you
// navigate to /leaderboard while the live query runs.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="mx-auto h-10 w-56 animate-pulse rounded-xl bg-zinc-800 sm:h-12 sm:w-72" />
      <div className="mx-auto mt-3 h-4 w-44 animate-pulse rounded bg-zinc-900" />

      <div className="mt-6 flex justify-center">
        <div className="h-9 w-36 animate-pulse rounded-full bg-zinc-900" />
      </div>
      <div className="mt-3 flex justify-center">
        <div className="h-9 w-60 animate-pulse rounded-full bg-zinc-900" />
      </div>

      <LeaderboardListSkeleton />
    </main>
  );
}
