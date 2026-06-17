import type { Fighter } from "./types";

// Current UFC men's top-10 (champions + ranked contenders) that weren't already
// in the legends pool. Source: UFC rankings (mid-2026). Ratings are authored
// (reputation/style based), era "Modern". Merged into FIGHTERS so both games
// feel current.

export const CURRENT_FIGHTERS: Fighter[] = [
  // --- Flyweight ---
  { id: "joshuavan", name: "Joshua Van", nickname: "", division: "Flyweight", era: "Modern", striking: 84, grappling: 74, cardio: 92, durability: 84, fightIq: 78, experience: 72, finishing: 78 },
  { id: "royval", name: "Brandon Royval", nickname: "Raw Dawg", division: "Flyweight", era: "Modern", striking: 82, grappling: 84, cardio: 86, durability: 72, fightIq: 76, experience: 78, finishing: 84 },
  { id: "albazi", name: "Amir Albazi", nickname: "The Prince", division: "Flyweight", era: "Modern", striking: 76, grappling: 84, cardio: 80, durability: 78, fightIq: 80, experience: 74, finishing: 78 },
  { id: "kkf", name: "Kai Kara-France", nickname: "", division: "Flyweight", era: "Modern", striking: 84, grappling: 70, cardio: 82, durability: 78, fightIq: 76, experience: 80, finishing: 80 },
  { id: "taira", name: "Tatsuro Taira", nickname: "", division: "Flyweight", era: "Modern", striking: 78, grappling: 86, cardio: 84, durability: 78, fightIq: 80, experience: 70, finishing: 82 },
  { id: "kape", name: "Manel Kape", nickname: "Starboy", division: "Flyweight", era: "Modern", striking: 86, grappling: 74, cardio: 80, durability: 78, fightIq: 74, experience: 76, finishing: 82 },
  { id: "almabayev", name: "Asu Almabayev", nickname: "", division: "Flyweight", era: "Modern", striking: 74, grappling: 86, cardio: 86, durability: 78, fightIq: 76, experience: 72, finishing: 76 },
  { id: "erceg", name: "Steve Erceg", nickname: "Astro Boy", division: "Flyweight", era: "Modern", striking: 80, grappling: 76, cardio: 82, durability: 76, fightIq: 76, experience: 72, finishing: 74 },

  // --- Bantamweight ---
  { id: "umar", name: "Umar Nurmagomedov", nickname: "", division: "Bantamweight", era: "Modern", striking: 82, grappling: 92, cardio: 88, durability: 82, fightIq: 86, experience: 78, finishing: 78 },
  { id: "yan", name: "Petr Yan", nickname: "No Mercy", division: "Bantamweight", era: "Modern", striking: 90, grappling: 82, cardio: 90, durability: 84, fightIq: 88, experience: 84, finishing: 80 },
  { id: "sandhagen", name: "Cory Sandhagen", nickname: "The Sandman", division: "Bantamweight", era: "Modern", striking: 88, grappling: 80, cardio: 88, durability: 80, fightIq: 86, experience: 84, finishing: 80 },
  { id: "songyadong", name: "Song Yadong", nickname: "", division: "Bantamweight", era: "Modern", striking: 86, grappling: 72, cardio: 82, durability: 80, fightIq: 78, experience: 80, finishing: 82 },
  { id: "vera", name: "Marlon Vera", nickname: "Chito", division: "Bantamweight", era: "Modern", striking: 84, grappling: 80, cardio: 86, durability: 88, fightIq: 80, experience: 84, finishing: 82 },
  { id: "bautista", name: "Mario Bautista", nickname: "", division: "Bantamweight", era: "Modern", striking: 80, grappling: 82, cardio: 84, durability: 80, fightIq: 80, experience: 76, finishing: 76 },
  { id: "font", name: "Rob Font", nickname: "", division: "Bantamweight", era: "Modern", striking: 84, grappling: 70, cardio: 86, durability: 72, fightIq: 78, experience: 84, finishing: 74 },
  { id: "cejudo", name: "Henry Cejudo", nickname: "Triple C", division: "Bantamweight", era: "Modern", striking: 84, grappling: 94, cardio: 88, durability: 82, fightIq: 90, experience: 88, finishing: 78 },

  // --- Featherweight ---
  { id: "evloev", name: "Movsar Evloev", nickname: "", division: "Featherweight", era: "Modern", striking: 78, grappling: 92, cardio: 90, durability: 84, fightIq: 86, experience: 80, finishing: 70 },
  { id: "diegolopes", name: "Diego Lopes", nickname: "", division: "Featherweight", era: "Modern", striking: 86, grappling: 86, cardio: 80, durability: 80, fightIq: 80, experience: 74, finishing: 86 },
  { id: "yair", name: "Yair Rodriguez", nickname: "El Pantera", division: "Featherweight", era: "Modern", striking: 88, grappling: 80, cardio: 84, durability: 80, fightIq: 80, experience: 82, finishing: 84 },
  { id: "ortega", name: "Brian Ortega", nickname: "T-City", division: "Featherweight", era: "Modern", striking: 80, grappling: 90, cardio: 82, durability: 82, fightIq: 82, experience: 84, finishing: 86 },
  { id: "arnoldallen", name: "Arnold Allen", nickname: "Almighty", division: "Featherweight", era: "Modern", striking: 84, grappling: 80, cardio: 82, durability: 82, fightIq: 82, experience: 80, finishing: 78 },
  { id: "lerone", name: "Lerone Murphy", nickname: "The Miracle", division: "Featherweight", era: "Modern", striking: 84, grappling: 84, cardio: 84, durability: 82, fightIq: 84, experience: 76, finishing: 80 },
  { id: "emmett", name: "Josh Emmett", nickname: "", division: "Featherweight", era: "Modern", striking: 86, grappling: 76, cardio: 74, durability: 84, fightIq: 74, experience: 82, finishing: 84 },
  { id: "jeansilva", name: "Jean Silva", nickname: "Lord", division: "Featherweight", era: "Modern", striking: 86, grappling: 78, cardio: 82, durability: 78, fightIq: 76, experience: 70, finishing: 84 },

  // --- Lightweight ---
  { id: "arman", name: "Arman Tsarukyan", nickname: "Ahalkalakets", division: "Lightweight", era: "Modern", striking: 84, grappling: 92, cardio: 90, durability: 84, fightIq: 86, experience: 80, finishing: 78 },
  { id: "hooker", name: "Dan Hooker", nickname: "The Hangman", division: "Lightweight", era: "Modern", striking: 86, grappling: 76, cardio: 84, durability: 84, fightIq: 78, experience: 86, finishing: 82 },
  { id: "gamrot", name: "Mateusz Gamrot", nickname: "Gamer", division: "Lightweight", era: "Modern", striking: 80, grappling: 90, cardio: 90, durability: 82, fightIq: 82, experience: 80, finishing: 76 },
  { id: "dariush", name: "Beneil Dariush", nickname: "", division: "Lightweight", era: "Modern", striking: 80, grappling: 88, cardio: 84, durability: 82, fightIq: 82, experience: 84, finishing: 82 },
  { id: "paddy", name: "Paddy Pimblett", nickname: "The Baddy", division: "Lightweight", era: "Modern", striking: 78, grappling: 84, cardio: 80, durability: 78, fightIq: 76, experience: 76, finishing: 82 },

  // --- Welterweight ---
  { id: "jdm", name: "Jack Della Maddalena", nickname: "JDM", division: "Welterweight", era: "Modern", striking: 90, grappling: 76, cardio: 86, durability: 86, fightIq: 84, experience: 80, finishing: 84 },
  { id: "belal", name: "Belal Muhammad", nickname: "Remember the Name", division: "Welterweight", era: "Modern", striking: 80, grappling: 88, cardio: 92, durability: 86, fightIq: 84, experience: 84, finishing: 64 },
  { id: "brady", name: "Sean Brady", nickname: "", division: "Welterweight", era: "Modern", striking: 80, grappling: 88, cardio: 86, durability: 84, fightIq: 84, experience: 80, finishing: 76 },
  { id: "shavkat", name: "Shavkat Rakhmonov", nickname: "Nomad", division: "Welterweight", era: "Modern", striking: 88, grappling: 90, cardio: 84, durability: 86, fightIq: 86, experience: 78, finishing: 92 },
  { id: "garry", name: "Ian Machado Garry", nickname: "The Future", division: "Welterweight", era: "Modern", striking: 86, grappling: 76, cardio: 86, durability: 80, fightIq: 82, experience: 76, finishing: 78 },
  { id: "buckley", name: "Joaquin Buckley", nickname: "New Mansa", division: "Welterweight", era: "Modern", striking: 86, grappling: 78, cardio: 82, durability: 80, fightIq: 76, experience: 80, finishing: 84 },
  { id: "morales", name: "Michael Morales", nickname: "", division: "Welterweight", era: "Modern", striking: 86, grappling: 78, cardio: 82, durability: 82, fightIq: 78, experience: 70, finishing: 82 },

  // --- Middleweight ---
  { id: "ddp", name: "Dricus du Plessis", nickname: "Stillknocks", division: "Middleweight", era: "Modern", striking: 84, grappling: 86, cardio: 90, durability: 88, fightIq: 84, experience: 82, finishing: 86 },
  { id: "imavov", name: "Nassourdine Imavov", nickname: "", division: "Middleweight", era: "Modern", striking: 86, grappling: 82, cardio: 84, durability: 82, fightIq: 84, experience: 80, finishing: 80 },
  { id: "strickland", name: "Sean Strickland", nickname: "Tarzan", division: "Middleweight", era: "Modern", striking: 86, grappling: 78, cardio: 90, durability: 92, fightIq: 84, experience: 84, finishing: 70 },
  { id: "borralho", name: "Caio Borralho", nickname: "The Natural", division: "Middleweight", era: "Modern", striking: 82, grappling: 86, cardio: 86, durability: 82, fightIq: 84, experience: 76, finishing: 76 },
  { id: "cannonier", name: "Jared Cannonier", nickname: "The Killa Gorilla", division: "Middleweight", era: "Modern", striking: 86, grappling: 76, cardio: 74, durability: 84, fightIq: 78, experience: 84, finishing: 82 },
  { id: "dolidze", name: "Roman Dolidze", nickname: "", division: "Middleweight", era: "Modern", striking: 80, grappling: 84, cardio: 78, durability: 82, fightIq: 78, experience: 78, finishing: 80 },
  { id: "fluffy", name: "Anthony Hernandez", nickname: "Fluffy", division: "Middleweight", era: "Modern", striking: 78, grappling: 90, cardio: 90, durability: 82, fightIq: 82, experience: 76, finishing: 84 },
  { id: "vettori", name: "Marvin Vettori", nickname: "The Italian Dream", division: "Middleweight", era: "Modern", striking: 80, grappling: 82, cardio: 88, durability: 88, fightIq: 78, experience: 82, finishing: 66 },

  // --- Light Heavyweight ---
  { id: "ankalaev", name: "Magomed Ankalaev", nickname: "", division: "Light Heavyweight", era: "Modern", striking: 84, grappling: 90, cardio: 86, durability: 88, fightIq: 86, experience: 82, finishing: 78 },
  { id: "prochazka", name: "Jiri Prochazka", nickname: "Denisa", division: "Light Heavyweight", era: "Modern", striking: 90, grappling: 76, cardio: 86, durability: 86, fightIq: 70, experience: 80, finishing: 90 },
  { id: "ulberg", name: "Carlos Ulberg", nickname: "Black Jag", division: "Light Heavyweight", era: "Modern", striking: 88, grappling: 72, cardio: 82, durability: 82, fightIq: 78, experience: 74, finishing: 84 },
  { id: "rountree", name: "Khalil Rountree Jr.", nickname: "The War Horse", division: "Light Heavyweight", era: "Modern", striking: 88, grappling: 66, cardio: 80, durability: 82, fightIq: 74, experience: 78, finishing: 84 },
  { id: "hill", name: "Jamahal Hill", nickname: "Sweet Dreams", division: "Light Heavyweight", era: "Modern", striking: 86, grappling: 70, cardio: 80, durability: 80, fightIq: 76, experience: 78, finishing: 82 },
  { id: "rakic", name: "Aleksandar Rakic", nickname: "Rocket", division: "Light Heavyweight", era: "Modern", striking: 84, grappling: 76, cardio: 78, durability: 80, fightIq: 78, experience: 80, finishing: 76 },
  { id: "reyes", name: "Dominick Reyes", nickname: "The Devastator", division: "Light Heavyweight", era: "Modern", striking: 84, grappling: 74, cardio: 78, durability: 78, fightIq: 76, experience: 80, finishing: 82 },
  { id: "oezdemir", name: "Volkan Oezdemir", nickname: "No Time", division: "Light Heavyweight", era: "Modern", striking: 84, grappling: 72, cardio: 74, durability: 82, fightIq: 74, experience: 82, finishing: 80 },
  { id: "krylov", name: "Nikita Krylov", nickname: "The Miner", division: "Light Heavyweight", era: "Modern", striking: 80, grappling: 82, cardio: 78, durability: 80, fightIq: 76, experience: 84, finishing: 82 },

  // --- Heavyweight ---
  { id: "gane", name: "Ciryl Gane", nickname: "Bon Gamin", division: "Heavyweight", era: "Modern", striking: 90, grappling: 70, cardio: 84, durability: 82, fightIq: 84, experience: 82, finishing: 78 },
  { id: "volkov", name: "Alexander Volkov", nickname: "Drago", division: "Heavyweight", era: "Modern", striking: 86, grappling: 70, cardio: 82, durability: 82, fightIq: 80, experience: 86, finishing: 80 },
  { id: "pavlovich", name: "Sergei Pavlovich", nickname: "", division: "Heavyweight", era: "Modern", striking: 88, grappling: 68, cardio: 70, durability: 82, fightIq: 72, experience: 78, finishing: 90 },
  { id: "blaydes", name: "Curtis Blaydes", nickname: "Razor", division: "Heavyweight", era: "Modern", striking: 78, grappling: 92, cardio: 84, durability: 72, fightIq: 80, experience: 84, finishing: 80 },
  { id: "almeida", name: "Jailton Almeida", nickname: "Malhadinho", division: "Heavyweight", era: "Modern", striking: 74, grappling: 92, cardio: 82, durability: 80, fightIq: 80, experience: 76, finishing: 86 },
  { id: "waldo", name: "Waldo Cortes-Acosta", nickname: "Salsa Boy", division: "Heavyweight", era: "Modern", striking: 84, grappling: 64, cardio: 80, durability: 82, fightIq: 74, experience: 72, finishing: 78 },
  { id: "tybura", name: "Marcin Tybura", nickname: "", division: "Heavyweight", era: "Modern", striking: 76, grappling: 82, cardio: 80, durability: 80, fightIq: 78, experience: 86, finishing: 74 },
  { id: "spivac", name: "Serghei Spivac", nickname: "The Polar Bear", division: "Heavyweight", era: "Modern", striking: 74, grappling: 84, cardio: 78, durability: 78, fightIq: 76, experience: 78, finishing: 80 },
  { id: "tuivasa", name: "Tai Tuivasa", nickname: "Bam Bam", division: "Heavyweight", era: "Modern", striking: 84, grappling: 58, cardio: 66, durability: 76, fightIq: 66, experience: 80, finishing: 86 },
];
