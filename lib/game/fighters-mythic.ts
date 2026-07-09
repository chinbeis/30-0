import type { Fighter } from "./types";

// MYTHIC fighters — ultra-rare violet cards: the community's meme versions,
// authored by hand. Each is significantly better than the base fighter with ONE
// signature trait pushed to the 96–99 band, but keeps the meme's famous flaw
// (3rd Round Romero still has no gas tank; Balls Hot Lewis still can't grapple).
//
// Id convention: `mythic_<baseId>` — baseId() strips the prefix so photos and
// "same fighter" checks resolve to the base fighter automatically. Overeem has
// no base card in the pool; his mythic stands alone (monogram avatar).
//
// Injection: at most ONE mythic per board, on ~50% of boards (see board.ts in
// both games). OP by design, so rarity is the balance lever.

export const MYTHIC_PREFIX = "mythic_";

export const MYTHIC_FIGHTERS: Fighter[] = [
  // The 13-second-Aldo era. Wide stance, left hand from hell.
  { id: "mythic_mcgregor", name: "Karate Stance McGregor", nickname: "Mystic Mac", division: "Lightweight", era: "2010s", isMythic: true, striking: 99, grappling: 72, cardio: 78, durability: 80, fightIq: 92, experience: 92, finishing: 97 },
  // Ubereem: K-1 champ on a strict horse-meat diet. Ask his opponents.
  { id: "mythic_overeem", name: "Horse Meat Overeem", nickname: "Ubereem", division: "Heavyweight", era: "2010s", isMythic: true, striking: 96, grappling: 84, cardio: 74, durability: 80, fightIq: 84, experience: 97, finishing: 98 },
  // Once Nate starts bleeding, he starts winning. Stockton rules.
  { id: "mythic_diaz", name: "Bleeding Nate Diaz", nickname: "Stockton 209", division: "Welterweight", era: "2010s", isMythic: true, striking: 88, grappling: 92, cardio: 99, durability: 98, fightIq: 84, experience: 95, finishing: 84 },
  // "My balls was hot." One punch. That's the whole scouting report.
  { id: "mythic_dlewis", name: "Balls Hot Lewis", nickname: "My Balls Was Hot", division: "Heavyweight", era: "Modern", isMythic: true, striking: 90, grappling: 56, cardio: 62, durability: 90, fightIq: 66, experience: 86, finishing: 99 },
  // Won the belt with one working eye. Cannot be finished, will not go away.
  { id: "mythic_bisping", name: "One Eye Bisping", nickname: "The Count", division: "Middleweight", era: "2010s", isMythic: true, striking: 88, grappling: 80, cardio: 93, durability: 97, fightIq: 90, experience: 98, finishing: 76 },
  // The pace nobody on earth can live with. Zoom.
  { id: "mythic_holloway", name: "Zoom Holloway", nickname: "Blessed Express", division: "Featherweight", era: "Modern", isMythic: true, striking: 96, grappling: 80, cardio: 99, durability: 92, fightIq: 93, experience: 95, finishing: 86 },
  // When the hair goes blonde, Do Bronx does not lose.
  { id: "mythic_oliveira", name: "Blonde Oliveira", nickname: "Do Bronx", division: "Lightweight", era: "Modern", isMythic: true, striking: 90, grappling: 98, cardio: 90, durability: 82, fightIq: 88, experience: 96, finishing: 99 },
  // Coasts two rounds. Then the third round starts and God help you.
  { id: "mythic_romero", name: "3rd Round Romero", nickname: "No Excuses", division: "Middleweight", era: "2010s", isMythic: true, striking: 94, grappling: 93, cardio: 70, durability: 92, fightIq: 80, experience: 86, finishing: 97 },
  // Three piece and a soda. Gamebred with nothing to lose.
  { id: "mythic_masvidal", name: "Backyard Masvidal", nickname: "Three Piece & a Soda", division: "Welterweight", era: "Modern", isMythic: true, striking: 93, grappling: 78, cardio: 84, durability: 90, fightIq: 82, experience: 95, finishing: 94 },
  // The timeline where the lifestyle never slowed him down. Terrifying.
  { id: "mythic_jones", name: "Cocaine Jones", nickname: "Bones", division: "Light Heavyweight", era: "Modern", isMythic: true, striking: 94, grappling: 97, cardio: 94, durability: 96, fightIq: 99, experience: 96, finishing: 92 },
  // The evolved Highlight: same violence, now with a plan.
  { id: "mythic_gaethje", name: "Patient Gaethje", nickname: "The Highlight", division: "Lightweight", era: "Modern", isMythic: true, striking: 96, grappling: 78, cardio: 90, durability: 88, fightIq: 90, experience: 92, finishing: 94 },
  // Peak title-reign Izzy. The gyno era was the untouchable era.
  { id: "mythic_adesanya", name: "Gyno Adesanya", nickname: "The Last Stylebender", division: "Middleweight", era: "Modern", isMythic: true, striking: 98, grappling: 74, cardio: 90, durability: 88, fightIq: 95, experience: 90, finishing: 88 },
  // Forrest Griffin, backing up, one punch. The Matrix years.
  { id: "mythic_silva", name: "Superman Punch Anderson Silva", nickname: "The Matrix", division: "Middleweight", era: "2000s", isMythic: true, striking: 99, grappling: 84, cardio: 86, durability: 82, fightIq: 97, experience: 96, finishing: 97 },
  // Five rounds, fifty judges, zero doubt. The cards always read Volkanovski.
  { id: "mythic_volkanovski", name: "Decision Volkanovski", nickname: "The Great", division: "Featherweight", era: "Modern", isMythic: true, striking: 93, grappling: 88, cardio: 98, durability: 90, fightIq: 98, experience: 94, finishing: 72 },
  // Retired, relaxed, waiting at the gate — and still the most dangerous man
  // in the terminal. Do not swing on Dustin at the airport.
  { id: "mythic_poirier", name: "Airport Porrier", nickname: "IGBBMN", division: "Lightweight", era: "Modern", isMythic: true, striking: 99, grappling: 84, cardio: 84, durability: 95, fightIq: 88, experience: 96, finishing: 92 },
];

export const MYTHIC_BY_ID: Record<string, Fighter> = Object.fromEntries(
  MYTHIC_FIGHTERS.map((f) => [f.id, f]),
);
