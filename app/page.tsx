import { auth } from "@/auth";
import Game from "./_game/Game";

export default async function Home() {
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
