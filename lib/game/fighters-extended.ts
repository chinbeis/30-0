import type { Fighter } from "./types";

// Wider-range pool of mid / lower-tier real fighters. Used to HARDEN trait-draft
// games (e.g. the GOAT builder) by giving the random triples a real chance of
// offering weak options. Kept separate so the core 30-0 game's calibration —
// which uses only FIGHTERS — is unaffected.
//
// Ratings are authored (reputation-based), deliberately spread DOWN: note the
// genuinely bad attributes (Derrick Lewis cardio, Roy Nelson cardio, Bonnar skill)
// — those are the "bad picks" that make a build run go sideways.

export const EXTRA_FIGHTERS: Fighter[] = [
  // Undefeated and undisputed (self-proclaimed). Elite wrestling, pillow hands,
  // and a well-documented triangle-choke allergy.
  { id: "sonnen", name: "Chael Sonnen", nickname: "The American Gangster", division: "Middleweight", era: "2010s", striking: 76, grappling: 91, cardio: 86, durability: 80, fightIq: 84, experience: 93, finishing: 66 },
  { id: "sanchez", name: "Diego Sanchez", nickname: "Nightmare", division: "Welterweight", era: "2010s", striking: 74, grappling: 78, cardio: 88, durability: 88, fightIq: 66, experience: 90, finishing: 70 },
  { id: "guida", name: "Clay Guida", nickname: "The Carpenter", division: "Lightweight", era: "2010s", striking: 66, grappling: 82, cardio: 92, durability: 82, fightIq: 72, experience: 86, finishing: 56 },
  { id: "lauzon", name: "Joe Lauzon", nickname: "J-Lau", division: "Lightweight", era: "2010s", striking: 70, grappling: 84, cardio: 76, durability: 66, fightIq: 70, experience: 82, finishing: 84 },
  { id: "jstephens", name: "Jeremy Stephens", nickname: "Lil Heathen", division: "Featherweight", era: "2010s", striking: 84, grappling: 62, cardio: 70, durability: 84, fightIq: 62, experience: 84, finishing: 80 },
  { id: "hardy", name: "Dan Hardy", nickname: "The Outlaw", division: "Welterweight", era: "2010s", striking: 82, grappling: 56, cardio: 76, durability: 80, fightIq: 66, experience: 74, finishing: 78 },
  { id: "mattbrown", name: "Matt Brown", nickname: "The Immortal", division: "Welterweight", era: "2010s", striking: 84, grappling: 66, cardio: 74, durability: 86, fightIq: 68, experience: 84, finishing: 84 },
  { id: "bonnar", name: "Stephan Bonnar", nickname: "The American Psycho", division: "Light Heavyweight", era: "2000s", striking: 66, grappling: 66, cardio: 74, durability: 88, fightIq: 58, experience: 74, finishing: 60 },
  { id: "forrest", name: "Forrest Griffin", nickname: "", division: "Light Heavyweight", era: "2000s", striking: 76, grappling: 74, cardio: 86, durability: 82, fightIq: 74, experience: 80, finishing: 68 },
  { id: "roynelson", name: "Roy Nelson", nickname: "Big Country", division: "Heavyweight", era: "2010s", striking: 78, grappling: 76, cardio: 54, durability: 97, fightIq: 68, experience: 84, finishing: 80 },
  { id: "dlewis", name: "Derrick Lewis", nickname: "The Black Beast", division: "Heavyweight", era: "Modern", striking: 82, grappling: 50, cardio: 48, durability: 86, fightIq: 60, experience: 80, finishing: 88 },
  { id: "arlovski", name: "Andrei Arlovski", nickname: "The Pitbull", division: "Heavyweight", era: "2000s", striking: 80, grappling: 66, cardio: 72, durability: 60, fightIq: 70, experience: 92, finishing: 76 },
  { id: "cubswanson", name: "Cub Swanson", nickname: "", division: "Featherweight", era: "2010s", striking: 84, grappling: 70, cardio: 82, durability: 68, fightIq: 72, experience: 84, finishing: 82 },
  { id: "mendes", name: "Chad Mendes", nickname: "Money", division: "Featherweight", era: "2010s", striking: 80, grappling: 86, cardio: 80, durability: 80, fightIq: 76, experience: 80, finishing: 78 },
  { id: "bjpenn", name: "BJ Penn", nickname: "The Prodigy", division: "Lightweight", era: "2000s", striking: 82, grappling: 86, cardio: 62, durability: 78, fightIq: 80, experience: 90, finishing: 80 },
  { id: "faber", name: "Urijah Faber", nickname: "The California Kid", division: "Bantamweight", era: "2010s", striking: 74, grappling: 86, cardio: 84, durability: 80, fightIq: 78, experience: 88, finishing: 74 },
  { id: "bisping", name: "Michael Bisping", nickname: "The Count", division: "Middleweight", era: "2010s", striking: 82, grappling: 72, cardio: 88, durability: 64, fightIq: 82, experience: 88, finishing: 66 },
  { id: "romero", name: "Yoel Romero", nickname: "Soldier of God", division: "Middleweight", era: "2010s", striking: 86, grappling: 84, cardio: 62, durability: 86, fightIq: 74, experience: 78, finishing: 84 },
  { id: "gastelum", name: "Kelvin Gastelum", nickname: "", division: "Middleweight", era: "Modern", striking: 82, grappling: 74, cardio: 74, durability: 80, fightIq: 74, experience: 80, finishing: 74 },
  { id: "costa", name: "Paulo Costa", nickname: "Borrachinha", division: "Middleweight", era: "Modern", striking: 86, grappling: 58, cardio: 56, durability: 84, fightIq: 60, experience: 72, finishing: 80 },
  { id: "covington", name: "Colby Covington", nickname: "Chaos", division: "Welterweight", era: "Modern", striking: 76, grappling: 90, cardio: 92, durability: 80, fightIq: 80, experience: 82, finishing: 60 },
  { id: "gburns", name: "Gilbert Burns", nickname: "Durinho", division: "Welterweight", era: "Modern", striking: 80, grappling: 88, cardio: 78, durability: 76, fightIq: 76, experience: 80, finishing: 84 },
  { id: "pettis", name: "Anthony Pettis", nickname: "Showtime", division: "Lightweight", era: "2010s", striking: 86, grappling: 66, cardio: 76, durability: 72, fightIq: 74, experience: 82, finishing: 82 },
  { id: "ealvarez", name: "Eddie Alvarez", nickname: "The Underground King", division: "Lightweight", era: "2010s", striking: 80, grappling: 76, cardio: 82, durability: 84, fightIq: 72, experience: 86, finishing: 80 },
  { id: "blachowicz", name: "Jan Blachowicz", nickname: "", division: "Light Heavyweight", era: "Modern", striking: 82, grappling: 78, cardio: 78, durability: 86, fightIq: 78, experience: 82, finishing: 80 },
  { id: "jds", name: "Junior dos Santos", nickname: "Cigano", division: "Heavyweight", era: "2010s", striking: 84, grappling: 70, cardio: 74, durability: 64, fightIq: 76, experience: 86, finishing: 82 },
  { id: "markhunt", name: "Mark Hunt", nickname: "The Super Samoan", division: "Heavyweight", era: "2010s", striking: 82, grappling: 50, cardio: 54, durability: 97, fightIq: 66, experience: 86, finishing: 84 },
];
