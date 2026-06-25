// Instant route-level fallback shown while auth + the player's stats/recent
// games load. Dimensions mirror the real profile to avoid layout shift.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-900" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-zinc-900" />
      </div>

      <div className="h-9 w-44 animate-pulse rounded-lg bg-zinc-800" />

      {/* profile card */}
      <div className="mt-5 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-5">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-40 animate-pulse rounded bg-zinc-900" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
            >
              <div className="h-8 w-8 animate-pulse rounded bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-12 animate-pulse rounded bg-zinc-800" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* recent games */}
      <div className="mt-8 h-7 w-40 animate-pulse rounded bg-zinc-800" />
      <ul className="mt-4 space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-zinc-800" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-800" />
              <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-900" />
            </div>
            <div className="space-y-2">
              <div className="ml-auto h-5 w-12 animate-pulse rounded bg-zinc-800" />
              <div className="ml-auto h-2.5 w-10 animate-pulse rounded bg-zinc-900" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
