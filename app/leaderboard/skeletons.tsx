// Skeleton placeholders for the leaderboard — reused by loading.tsx (full page)
// and the in-page <Suspense> fallback (list only, on filter changes). Dimensions
// mirror the real rows to avoid layout shift when content streams in.

export function LeaderboardRowSkeleton() {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3">
      <div className="h-5 w-8 shrink-0 animate-pulse rounded bg-zinc-800" />
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-zinc-800" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-zinc-900" />
      </div>
      <div className="space-y-2">
        <div className="ml-auto h-5 w-12 animate-pulse rounded bg-zinc-800" />
        <div className="ml-auto h-2.5 w-10 animate-pulse rounded bg-zinc-900" />
      </div>
    </li>
  );
}

export function LeaderboardListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ol className="mt-8 space-y-1.5">
      {Array.from({ length: rows }).map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </ol>
  );
}
