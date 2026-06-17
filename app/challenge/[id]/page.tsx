import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getChallenge } from "@/lib/queries";
import Game from "@/app/_game/Game";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ch = await getChallenge(id).catch(() => null);
  if (!ch) return { title: "Challenge · Can You Go 30-0?" };
  return {
    title: `Beat ${ch.creatorName}'s ${ch.creatorWins}-${ch.creatorLosses} · Can You Go 30-0?`,
    description: `${ch.creatorName} went ${ch.creatorWins}-${ch.creatorLosses}. Draft the same fighters and try to beat them.`,
  };
}

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ch = await getChallenge(id).catch(() => null);
  if (!ch) notFound();

  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;

  return (
    <main className="flex flex-1 flex-col">
      <Game
        user={user}
        challenge={{
          id: ch.id,
          seed: ch.seed,
          creatorName: ch.creatorName,
          creatorWins: ch.creatorWins,
          creatorLosses: ch.creatorLosses,
          creatorGoat: ch.creatorGoat,
        }}
      />
    </main>
  );
}
