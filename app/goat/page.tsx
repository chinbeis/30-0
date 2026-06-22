import type { Metadata } from "next";
import { auth } from "@/auth";
import Build from "./_game/Build";

export const metadata: Metadata = {
  title: "Can You Become the GOAT?",
  description:
    "Build one fighter from the traits of MMA legends, then run a 13-fight undefeated gauntlet to become a triple champion. Under 60 seconds.",
};

export default async function GoatPage() {
  // AI caricature only works if an OpenAI key is configured; otherwise the result
  // screen shows a default composite "fighter card" instead.
  const portraitEnabled = !!process.env.OPENAI_API_KEY;
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;
  return (
    <main className="flex flex-1 flex-col">
      <Build portraitEnabled={portraitEnabled} user={user} />
    </main>
  );
}
