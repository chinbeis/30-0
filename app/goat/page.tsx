import type { Metadata } from "next";
import Build from "./_game/Build";

export const metadata: Metadata = {
  title: "Can You Become the GOAT?",
  description:
    "Build one fighter from the traits of MMA legends, then run a 13-fight undefeated gauntlet to become a triple champion. Under 60 seconds.",
};

export default function GoatPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Build />
    </main>
  );
}
