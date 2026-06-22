import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getChallenge } from "@/lib/queries";
import Build from "@/app/goat/_game/Build";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ch = await getChallenge(id).catch(() => null);
  if (!ch || ch.game !== "goat") return { title: "Challenge · Can You Become the GOAT?" };
  return {
    title: `Beat ${ch.creatorName}'s ${ch.creatorWins}-${ch.creatorLosses} · Can You Become the GOAT?`,
    description: `${ch.creatorName} built a ${ch.creatorWins}-${ch.creatorLosses} fighter. Build your own from the same board and try to beat them.`,
  };
}

export default async function GoatChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ch = await getChallenge(id).catch(() => null);
  if (!ch || ch.game !== "goat") notFound();

  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;

  const portraitEnabled = !!process.env.OPENAI_API_KEY;

  return (
    <main className="flex flex-1 flex-col">
      <Build
        portraitEnabled={portraitEnabled}
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
