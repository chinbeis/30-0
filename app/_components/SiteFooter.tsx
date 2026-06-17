import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-900 px-4 py-8 text-center text-xs leading-relaxed text-zinc-600">
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="flex justify-center gap-4 font-semibold text-zinc-500">
          <Link href="/how-it-works" className="hover:text-zinc-300">
            How it works
          </Link>
          <Link href="/about" className="hover:text-zinc-300">
            About
          </Link>
        </div>
        <p>
          A fan-made game for MMA fans. Not affiliated with, endorsed by, or
          sponsored by the UFC, Zuffa, or any fighter. Fighter names and likenesses
          belong to their respective owners; photos are sourced from Wikipedia /
          Wikimedia Commons under their respective licenses.
        </p>
        <p>Can You Go 30&ndash;0? · Inspired by 82-0</p>
      </div>
    </footer>
  );
}
