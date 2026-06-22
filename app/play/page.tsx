import type { Metadata } from "next";
import { auth } from "@/auth";
import Game from "../_game/Game";

export const metadata: Metadata = {
  title: "Play · Can You Go 30-0?",
  description:
    "Draft 10 MMA fighters, simulate a 30-fight season, and find out if you can go a perfect 30-0.",
};

export default async function Play() {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;

  return (
    <main className="flex flex-1 flex-col">
      <Game user={user} />
    </main>
  );
}
