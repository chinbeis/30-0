import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export async function SiteFooter() {
  const t = await getT();
  return (
    <footer className="border-t border-white/5 px-4 py-5 text-xs text-zinc-600">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 sm:flex-row">
        <p>{t.footer.disclaimer}</p>
        <div className="flex gap-4 font-semibold text-zinc-500">
          <Link href="/how-it-works" className="hover:text-white">
            {t.footer.howItWorks}
          </Link>
          <Link href="/about" className="hover:text-white">
            {t.footer.about}
          </Link>
        </div>
      </div>
    </footer>
  );
}
