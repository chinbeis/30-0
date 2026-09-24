// Skeleton placeholders for the leaderboard — reused by loading.tsx (full page)
// and the in-page <Suspense> fallback (list only, on filter changes). Dimensions
// mirror the real podium + table to avoid layout shift when content streams in.

function PodiumSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-3 items-end gap-2 sm:gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`flex flex-col items-center rounded-lg border border-white/10 bg-black/60 px-2 pt-4 pb-3 ${
            i === 1 ? "sm:-mt-6" : ""
          }`}
        >
          <div className="h-7 w-5 animate-pulse rounded bg-zinc-800" />
          <div className={`mt-3 animate-pulse rounded-full bg-zinc-800 ${i === 1 ? "h-16 w-16" : "h-13 w-13"}`} />
          <div className="mt-3 h-3.5 w-16 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-8 w-14 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-2.5 w-12 animate-pulse rounded bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardRowSkeleton() {
  return (
    <li className="grid grid-cols-[2.5rem_1fr_4.5rem_3.5rem] items-center gap-2 px-3 py-2.5">
      <div className="mx-auto h-4 w-5 animate-pulse rounded bg-zinc-800" />
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-zinc-800" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-800" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-900" />
        </div>
      </div>
      <div className="ml-auto h-6 w-12 animate-pulse rounded bg-zinc-800" />
      <div className="ml-auto h-4 w-7 animate-pulse rounded bg-zinc-900" />
    </li>
  );
}

export function LeaderboardListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <>
      <PodiumSkeleton />
      <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/60">
        <div className="h-8 border-b border-white/10" />
        <ol className="divide-y divide-white/5">
          {Array.from({ length: rows }).map((_, i) => (
            <LeaderboardRowSkeleton key={i} />
          ))}
        </ol>
      </div>
    </>
  );
}
