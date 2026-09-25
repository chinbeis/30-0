"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Header nav with a current-page marker. Client-only because the pathname
// can't be read in a Server Component.
export function NavLinks({
  links,
}: {
  /** `also` = extra path prefixes that count as this tab (e.g. the game routes under "Play"). */
  links: { href: string; label: string; also?: string[] }[];
}) {
  const pathname = usePathname();

  return (
    <>
      {links.map((l) => {
        const active =
          (l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)) ||
          !!l.also?.some((p) => pathname.startsWith(p));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition hover:text-white ${
              active ? "text-white" : "text-zinc-500"
            }`}
          >
            {l.label}
            {active && (
              <span className="absolute inset-x-2.5 -bottom-[13px] h-0.5 bg-fight" aria-hidden />
            )}
          </Link>
        );
      })}
    </>
  );
}
