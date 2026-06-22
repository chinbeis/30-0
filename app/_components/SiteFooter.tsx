import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export async function SiteFooter() {
  const t = await getT();
  return (
    <footer className="border-t border-zinc-900 px-4 py-8 text-center text-xs leading-relaxed text-zinc-600">
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="flex justify-center gap-4 font-semibold text-zinc-500">
          <Link href="/how-it-works" className="hover:text-zinc-300">
            {t.footer.howItWorks}
          </Link>
          <Link href="/about" className="hover:text-zinc-300">
            {t.footer.about}
          </Link>
        </div>
        <p>{t.footer.disclaimer}</p>
        <p>{t.footer.tagline}</p>
      </div>
    </footer>
  );
}
