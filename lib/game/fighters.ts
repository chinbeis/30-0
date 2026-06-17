import type { Fighter } from "./types";

// Seed pool for MVP. ~48 marquee fighters across eras/divisions.
//
// IMPORTANT: the 7 ratings are AUTHORED (reputation-based, subjective) — NOT raw
// UFC stats. No public dataset gives you "Fight IQ: 94". Real UFCStats data
// (SLpM, TD avg, sub avg, accuracy...) can be mapped into these later (see
// deriveRatings notes in README), but for the MVP "feel" hand-tuning wins.
//
// Ratings are intentionally spread so the 3-fighter choice rounds force real
// trade-offs instead of "always pick the highest OVR".

export const FIGHTERS: Fighter[] = [
  // --- Lightweight ---
  { id: "khabib", name: "Khabib Nurmagomedov", nickname: "The Eagle", division: "Lightweight", era: "2010s", striking: 78, grappling: 99, cardio: 95, durability: 92, fightIq: 96, experience: 90, finishing: 82 },
  { id: "islam", name: "Islam Makhachev", nickname: "", division: "Lightweight", era: "Modern", striking: 84, grappling: 96, cardio: 94, durability: 90, fightIq: 94, experience: 86, finishing: 80 },
  { id: "oliveira", name: "Charles Oliveira", nickname: "Do Bronx", division: "Lightweight", era: "Modern", striking: 85, grappling: 95, cardio: 88, durability: 78, fightIq: 84, experience: 95, finishing: 96 },
  { id: "poirier", name: "Dustin Poirier", nickname: "The Diamond", division: "Lightweight", era: "Modern", striking: 90, grappling: 82, cardio: 88, durability: 82, fightIq: 88, experience: 94, finishing: 88 },
  { id: "gaethje", name: "Justin Gaethje", nickname: "The Highlight", division: "Lightweight", era: "Modern", striking: 93, grappling: 75, cardio: 87, durability: 84, fightIq: 80, experience: 88, finishing: 90 },
  { id: "mcgregor", name: "Conor McGregor", nickname: "The Notorious", division: "Lightweight", era: "2010s", striking: 92, grappling: 68, cardio: 72, durability: 76, fightIq: 86, experience: 90, finishing: 92 },

  // --- Featherweight ---
  { id: "volkanovski", name: "Alexander Volkanovski", nickname: "The Great", division: "Featherweight", era: "Modern", striking: 90, grappling: 86, cardio: 96, durability: 88, fightIq: 95, experience: 90, finishing: 80 },
  { id: "aldo", name: "Jose Aldo", nickname: "Junior", division: "Featherweight", era: "2010s", striking: 92, grappling: 84, cardio: 86, durability: 84, fightIq: 92, experience: 95, finishing: 84 },
  { id: "holloway", name: "Max Holloway", nickname: "Blessed", division: "Featherweight", era: "Modern", striking: 92, grappling: 78, cardio: 97, durability: 88, fightIq: 90, experience: 92, finishing: 82 },
  { id: "topuria", name: "Ilia Topuria", nickname: "El Matador", division: "Featherweight", era: "Modern", striking: 90, grappling: 90, cardio: 86, durability: 86, fightIq: 88, experience: 76, finishing: 90 },

  // --- Welterweight ---
  { id: "gsp", name: "Georges St-Pierre", nickname: "Rush", division: "Welterweight", era: "2000s", striking: 88, grappling: 95, cardio: 95, durability: 90, fightIq: 98, experience: 96, finishing: 78 },
  { id: "usman", name: "Kamaru Usman", nickname: "The Nigerian Nightmare", division: "Welterweight", era: "Modern", striking: 86, grappling: 94, cardio: 92, durability: 88, fightIq: 90, experience: 88, finishing: 78 },
  { id: "edwards", name: "Leon Edwards", nickname: "Rocky", division: "Welterweight", era: "Modern", striking: 87, grappling: 84, cardio: 90, durability: 84, fightIq: 88, experience: 84, finishing: 72 },
  { id: "diaz", name: "Nate Diaz", nickname: "", division: "Welterweight", era: "2010s", striking: 84, grappling: 86, cardio: 94, durability: 90, fightIq: 82, experience: 92, finishing: 78 },
  { id: "lawler", name: "Robbie Lawler", nickname: "Ruthless", division: "Welterweight", era: "2010s", striking: 90, grappling: 72, cardio: 82, durability: 90, fightIq: 80, experience: 92, finishing: 88 },

  // --- Middleweight ---
  { id: "silva", name: "Anderson Silva", nickname: "The Spider", division: "Middleweight", era: "2000s", striking: 97, grappling: 82, cardio: 84, durability: 80, fightIq: 95, experience: 96, finishing: 94 },
  { id: "adesanya", name: "Israel Adesanya", nickname: "The Last Stylebender", division: "Middleweight", era: "Modern", striking: 95, grappling: 70, cardio: 86, durability: 84, fightIq: 92, experience: 86, finishing: 82 },
  { id: "whittaker", name: "Robert Whittaker", nickname: "The Reaper", division: "Middleweight", era: "Modern", striking: 89, grappling: 82, cardio: 90, durability: 84, fightIq: 90, experience: 88, finishing: 80 },
  { id: "chimaev", name: "Khamzat Chimaev", nickname: "Borz", division: "Middleweight", era: "Modern", striking: 82, grappling: 95, cardio: 80, durability: 84, fightIq: 84, experience: 70, finishing: 90 },
  { id: "weidman", name: "Chris Weidman", nickname: "The All-American", division: "Middleweight", era: "2010s", striking: 80, grappling: 90, cardio: 84, durability: 80, fightIq: 84, experience: 86, finishing: 80 },

  // --- Light Heavyweight ---
  { id: "jones", name: "Jon Jones", nickname: "Bones", division: "Light Heavyweight", era: "Modern", striking: 92, grappling: 95, cardio: 92, durability: 92, fightIq: 99, experience: 96, finishing: 88 },
  { id: "cormier", name: "Daniel Cormier", nickname: "DC", division: "Light Heavyweight", era: "2010s", striking: 84, grappling: 94, cardio: 88, durability: 88, fightIq: 92, experience: 92, finishing: 82 },
  { id: "pereira", name: "Alex Pereira", nickname: "Poatan", division: "Light Heavyweight", era: "Modern", striking: 96, grappling: 66, cardio: 82, durability: 88, fightIq: 86, experience: 76, finishing: 94 },
  { id: "rua", name: "Mauricio Rua", nickname: "Shogun", division: "Light Heavyweight", era: "2000s", striking: 88, grappling: 82, cardio: 80, durability: 80, fightIq: 82, experience: 92, finishing: 88 },
  { id: "gustafsson", name: "Alexander Gustafsson", nickname: "The Mauler", division: "Light Heavyweight", era: "2010s", striking: 86, grappling: 80, cardio: 84, durability: 80, fightIq: 84, experience: 84, finishing: 78 },

  // --- Heavyweight ---
  { id: "jones_hw", name: "Stipe Miocic", nickname: "", division: "Heavyweight", era: "Modern", striking: 86, grappling: 84, cardio: 90, durability: 86, fightIq: 90, experience: 90, finishing: 84 },
  { id: "ngannou", name: "Francis Ngannou", nickname: "The Predator", division: "Heavyweight", era: "Modern", striking: 95, grappling: 70, cardio: 76, durability: 86, fightIq: 80, experience: 82, finishing: 96 },
  { id: "dc_hw", name: "Cain Velasquez", nickname: "", division: "Heavyweight", era: "2010s", striking: 84, grappling: 92, cardio: 94, durability: 80, fightIq: 88, experience: 86, finishing: 86 },
  { id: "aspinall", name: "Tom Aspinall", nickname: "", division: "Heavyweight", era: "Modern", striking: 88, grappling: 88, cardio: 82, durability: 82, fightIq: 86, experience: 76, finishing: 92 },
  { id: "fedor", name: "Fedor Emelianenko", nickname: "The Last Emperor", division: "Heavyweight", era: "Pioneer", striking: 88, grappling: 92, cardio: 86, durability: 88, fightIq: 92, experience: 96, finishing: 90 },
  { id: "werdum", name: "Fabricio Werdum", nickname: "Vai Cavalo", division: "Heavyweight", era: "2010s", striking: 78, grappling: 92, cardio: 82, durability: 80, fightIq: 84, experience: 90, finishing: 84 },

  // --- Bantamweight ---
  { id: "sterling", name: "Aljamain Sterling", nickname: "Funk Master", division: "Bantamweight", era: "Modern", striking: 80, grappling: 92, cardio: 90, durability: 80, fightIq: 86, experience: 84, finishing: 74 },
  { id: "ohamalley", name: "Sean O'Malley", nickname: "Sugar", division: "Bantamweight", era: "Modern", striking: 90, grappling: 70, cardio: 84, durability: 76, fightIq: 84, experience: 76, finishing: 84 },
  { id: "dillashaw", name: "TJ Dillashaw", nickname: "", division: "Bantamweight", era: "2010s", striking: 88, grappling: 82, cardio: 90, durability: 80, fightIq: 88, experience: 86, finishing: 82 },
  { id: "cruz", name: "Dominick Cruz", nickname: "The Dominator", division: "Bantamweight", era: "2010s", striking: 86, grappling: 84, cardio: 92, durability: 78, fightIq: 94, experience: 90, finishing: 70 },
  { id: "obrien_dvalishvili", name: "Merab Dvalishvili", nickname: "The Machine", division: "Bantamweight", era: "Modern", striking: 78, grappling: 94, cardio: 99, durability: 84, fightIq: 88, experience: 84, finishing: 66 },

  // --- Flyweight ---
  { id: "dj", name: "Demetrious Johnson", nickname: "Mighty Mouse", division: "Flyweight", era: "2010s", striking: 88, grappling: 92, cardio: 96, durability: 84, fightIq: 97, experience: 92, finishing: 86 },
  { id: "figueiredo", name: "Deiveson Figueiredo", nickname: "Deus da Guerra", division: "Flyweight", era: "Modern", striking: 88, grappling: 86, cardio: 80, durability: 82, fightIq: 82, experience: 82, finishing: 88 },
  { id: "moreno", name: "Brandon Moreno", nickname: "The Assassin Baby", division: "Flyweight", era: "Modern", striking: 84, grappling: 86, cardio: 92, durability: 86, fightIq: 86, experience: 84, finishing: 80 },
  { id: "pantoja", name: "Alexandre Pantoja", nickname: "", division: "Flyweight", era: "Modern", striking: 84, grappling: 90, cardio: 90, durability: 84, fightIq: 86, experience: 84, finishing: 82 },

  // --- Women's divisions ---
  { id: "nunes", name: "Amanda Nunes", nickname: "The Lioness", division: "Women's Bantamweight", era: "Modern", striking: 92, grappling: 88, cardio: 84, durability: 86, fightIq: 90, experience: 92, finishing: 92 },
  { id: "shevchenko", name: "Valentina Shevchenko", nickname: "Bullet", division: "Women's Flyweight", era: "Modern", striking: 92, grappling: 86, cardio: 90, durability: 86, fightIq: 94, experience: 90, finishing: 84 },
  { id: "zhang", name: "Zhang Weili", nickname: "Magnum", division: "Women's Strawweight", era: "Modern", striking: 90, grappling: 84, cardio: 90, durability: 86, fightIq: 88, experience: 84, finishing: 84 },
  { id: "rousey", name: "Ronda Rousey", nickname: "Rowdy", division: "Women's Bantamweight", era: "2010s", striking: 64, grappling: 92, cardio: 80, durability: 70, fightIq: 74, experience: 80, finishing: 90 },
  { id: "jedrzejczyk", name: "Joanna Jedrzejczyk", nickname: "Joanna Champion", division: "Women's Strawweight", era: "2010s", striking: 90, grappling: 74, cardio: 92, durability: 82, fightIq: 86, experience: 86, finishing: 76 },

  // --- A few deliberately lower-tier / wildcard picks to create real choices ---
  { id: "ferguson", name: "Tony Ferguson", nickname: "El Cucuy", division: "Lightweight", era: "2010s", striking: 84, grappling: 86, cardio: 92, durability: 82, fightIq: 78, experience: 90, finishing: 86 },
  { id: "masvidal", name: "Jorge Masvidal", nickname: "Gamebred", division: "Welterweight", era: "Modern", striking: 86, grappling: 76, cardio: 80, durability: 82, fightIq: 78, experience: 90, finishing: 82 },
  { id: "cerrone", name: "Donald Cerrone", nickname: "Cowboy", division: "Lightweight", era: "2010s", striking: 84, grappling: 82, cardio: 82, durability: 78, fightIq: 76, experience: 96, finishing: 86 },
  { id: "till", name: "Darren Till", nickname: "The Gorilla", division: "Middleweight", era: "Modern", striking: 84, grappling: 70, cardio: 74, durability: 76, fightIq: 74, experience: 78, finishing: 76 },
];

export const FIGHTERS_BY_ID: Record<string, Fighter> = Object.fromEntries(
  FIGHTERS.map((f) => [f.id, f]),
);

export function getFighter(id: string): Fighter {
  const f = FIGHTERS_BY_ID[id];
  if (!f) throw new Error(`Unknown fighter id: ${id}`);
  return f;
}
