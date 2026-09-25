import type { Fighter } from "./types";

// MYTHIC fighters — ultra-rare violet cards: the community's meme versions,
// authored by hand. Each is DRASTICALLY better than the base fighter —
// signature traits at 97–99, most others in the 90s — but keeps the meme's famous flaw
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
  { id: "mythic_mcgregor", name: "Karate Stance McGregor", nickname: "Mystic Mac", division: "Lightweight", era: "2010s", isMythic: true, striking: 99, grappling: 84, cardio: 92, durability: 92, fightIq: 97, experience: 95, finishing: 99 },
  // Ubereem: K-1 champ on a strict horse-meat diet. Ask his opponents.
  { id: "mythic_overeem", name: "Horse Meat Overeem", nickname: "Ubereem", division: "Heavyweight", era: "2010s", isMythic: true, striking: 98, grappling: 88, cardio: 80, durability: 80, fightIq: 88, experience: 98, finishing: 99 },
  // Once Nate starts bleeding, he starts winning. Stockton rules.
  { id: "mythic_diaz", name: "Bleeding Nate Diaz", nickname: "Stockton 209", division: "Welterweight", era: "2010s", isMythic: true, striking: 92, grappling: 94, cardio: 99, durability: 99, fightIq: 88, experience: 97, finishing: 88 },
  // "My balls was hot." One punch. That's the whole scouting report.
  { id: "mythic_dlewis", name: "Balls Hot Lewis", nickname: "My Balls Was Hot", division: "Heavyweight", era: "Modern", isMythic: true, striking: 98, grappling: 58, cardio: 64, durability: 94, fightIq: 70, experience: 90, finishing: 99 },
  // Won the belt with one working eye. Cannot be finished, will not go away.
  { id: "mythic_bisping", name: "One Eye Bisping", nickname: "The Count", division: "Middleweight", era: "2010s", isMythic: true, striking: 96, grappling: 84, cardio: 96, durability: 99, fightIq: 93, experience: 99, finishing: 88 },
  // The pace nobody on earth can live with. Zoom.
  { id: "mythic_holloway", name: "Zoom Holloway", nickname: "Blessed Express", division: "Featherweight", era: "Modern", isMythic: true, striking: 98, grappling: 84, cardio: 99, durability: 96, fightIq: 96, experience: 97, finishing: 90 },
  // When the hair goes blonde, Do Bronx does not lose.
  { id: "mythic_oliveira", name: "Blonde Oliveira", nickname: "Do Bronx", division: "Lightweight", era: "Modern", isMythic: true, striking: 93, grappling: 99, cardio: 93, durability: 96, fightIq: 91, experience: 98, finishing: 99 },
  // Coasts two rounds. Then the third round starts and God help you.
  { id: "mythic_romero", name: "3rd Round Romero", nickname: "No Excuses", division: "Middleweight", era: "2010s", isMythic: true, striking: 97, grappling: 96, cardio: 70, durability: 99, fightIq: 84, experience: 90, finishing: 99 },
  // Three piece and a soda. Gamebred with nothing to lose.
  { id: "mythic_masvidal", name: "Backyard Masvidal", nickname: "Three Piece & a Soda", division: "Welterweight", era: "Modern", isMythic: true, striking: 99, grappling: 82, cardio: 88, durability: 93, fightIq: 86, experience: 96, finishing: 97 },
  // The timeline where the lifestyle never slowed him down. Terrifying.
  { id: "mythic_jones", name: "Cocaine Jones", nickname: "White", division: "Light Heavyweight", era: "Modern", isMythic: true, striking: 96, grappling: 99, cardio: 96, durability: 98, fightIq: 99, experience: 98, finishing: 95 },
  // The evolved Highlight: same violence, now with a plan.
  { id: "mythic_gaethje", name: "Patient Gaethje", nickname: "The Highlight", division: "Lightweight", era: "Modern", isMythic: true, striking: 98, grappling: 82, cardio: 93, durability: 92, fightIq: 93, experience: 94, finishing: 97 },
  // Peak title-reign Izzy. The gyno era was the untouchable era.
  { id: "mythic_adesanya", name: "Gyno Adesanya", nickname: "The Last Stylebender", division: "Middleweight", era: "Modern", isMythic: true, striking: 99, grappling: 78, cardio: 93, durability: 96, fightIq: 97, experience: 93, finishing: 95 },
  // Forrest Griffin, backing up, one punch. The Matrix years.
  { id: "mythic_silva", name: "Superman Punch Silva", nickname: "The Matrix", division: "Middleweight", era: "2000s", isMythic: true, striking: 99, grappling: 88, cardio: 90, durability: 86, fightIq: 99, experience: 98, finishing: 99 },
  // Five rounds, fifty judges, zero doubt. The cards always read Volkanovski.
  { id: "mythic_volkanovski", name: "Decision Volkanovski", nickname: "The Great", division: "Featherweight", era: "Modern", isMythic: true, striking: 97, grappling: 92, cardio: 99, durability: 93, fightIq: 99, experience: 99, finishing: 84 },
  // Retired, relaxed, waiting at the gate — and still the most dangerous man
  // in the terminal. Do not swing on Dustin at the airport.
  { id: "mythic_poirier", name: "Airport Porrier", nickname: "IGBBMN", division: "Lightweight", era: "Modern", isMythic: true, striking: 99, grappling: 88, cardio: 88, durability: 97, fightIq: 92, experience: 98, finishing: 95 },
  // Undefeated at sea level. The Werdum loss? Mexico City altitude. Never
  // happened. Cardio from another planet, knees still made of glass.
  { id: "mythic_dc_hw", name: "Sea Level Cain", nickname: "Brown Pride", division: "Heavyweight", era: "2010s", isMythic: true, striking: 93, grappling: 98, cardio: 99, durability: 80, fightIq: 94, experience: 92, finishing: 96 },
  // Whatever's in the bottle, it's working. Built like a Marvel villain, gas
  // tank finally fixed — the fight IQ is still in the locker room.
  { id: "mythic_costa", name: "Secret Juice Costa", nickname: "Borrachinha", division: "Middleweight", era: "Modern", isMythic: true, striking: 97, grappling: 76, cardio: 92, durability: 98, fightIq: 66, experience: 84, finishing: 98 },
  // The redder the face, the scarier El Cucuy gets. Blood is just fuel.
  { id: "mythic_ferguson", name: "Bloody Ferguson", nickname: "El Cucuy", division: "Lightweight", era: "2010s", isMythic: true, striking: 94, grappling: 95, cardio: 99, durability: 99, fightIq: 82, experience: 96, finishing: 97 },
  // Four and a half rounds of Anderson Silva on his back. Pure top control.
  // Still can't finish, still allergic to triangles — you just can't get close.
  { id: "mythic_sonnen", name: "Gangster Sonnen", nickname: "I Can't Let You Get Close", division: "Middleweight", era: "2010s", isMythic: true, striking: 86, grappling: 99, cardio: 98, durability: 93, fightIq: 95, experience: 99, finishing: 72 },
];

export const MYTHIC_BY_ID: Record<string, Fighter> = Object.fromEntries(
  MYTHIC_FIGHTERS.map((f) => [f.id, f]),
);
