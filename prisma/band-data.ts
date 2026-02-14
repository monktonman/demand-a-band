// 1,000 bands across genres relevant to AAA/indie radio markets
// Organized by genre buckets with realistic names

export interface SeedBand {
  name: string;
  slug: string;
  genres: string[];
  popularity: number;
  monthlyListeners?: number;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Helper to generate a band entry
function b(name: string, genres: string[], popularity: number, monthlyListeners?: number): SeedBand {
  return { name, slug: slug(name), genres, popularity, monthlyListeners };
}

// ============================================
// REAL / WELL-KNOWN ARTISTS (200)
// These are actual artists that would be on AAA radio
// ============================================

const realArtists: SeedBand[] = [
  // Indie Rock / Alternative (50)
  b("Radiohead", ["Rock", "Alternative", "Electronic"], 85, 22000000),
  b("The National", ["Indie Rock", "Rock", "Alternative"], 73, 8200000),
  b("Bon Iver", ["Indie Rock", "Folk", "Electronic"], 78, 12000000),
  b("Phoebe Bridgers", ["Indie Rock", "Singer-Songwriter", "Folk"], 75, 9500000),
  b("Big Thief", ["Indie Rock", "Folk", "Alternative"], 68, 4200000),
  b("Japanese Breakfast", ["Indie Rock", "Pop", "Alternative"], 67, 5100000),
  b("Beach House", ["Indie Rock", "Electronic", "Alternative"], 70, 7800000),
  b("Arcade Fire", ["Indie Rock", "Rock", "Alternative"], 72, 8900000),
  b("Fleet Foxes", ["Folk", "Indie Rock", "Singer-Songwriter"], 71, 6700000),
  b("The War on Drugs", ["Indie Rock", "Rock", "Alternative"], 72, 5400000),
  b("Boygenius", ["Indie Rock", "Singer-Songwriter", "Alternative"], 72, 6800000),
  b("Alvvays", ["Indie Rock", "Pop", "Alternative"], 63, 3200000),
  b("Fontaines D.C.", ["Punk", "Rock", "Alternative"], 64, 3800000),
  b("Snail Mail", ["Indie Rock", "Singer-Songwriter", "Alternative"], 55, 2100000),
  b("Lucy Dacus", ["Indie Rock", "Singer-Songwriter"], 63, 3500000),
  b("Julien Baker", ["Indie Rock", "Singer-Songwriter", "Alternative"], 58, 1900000),
  b("Future Islands", ["Indie Rock", "Electronic", "Pop"], 60, 3200000),
  b("Animal Collective", ["Experimental", "Electronic", "Indie Rock"], 58, 2800000),
  b("Wilco", ["Rock", "Alternative", "Americana"], 63, 3100000),
  b("My Morning Jacket", ["Rock", "Alternative", "Americana"], 58, 2400000),
  b("Vampire Weekend", ["Indie Rock", "Pop", "Alternative"], 74, 11000000),
  b("Modest Mouse", ["Indie Rock", "Alternative", "Rock"], 66, 7200000),
  b("Interpol", ["Indie Rock", "Rock", "Alternative"], 65, 5600000),
  b("Deerhunter", ["Indie Rock", "Experimental", "Alternative"], 52, 1500000),
  b("TV on the Radio", ["Indie Rock", "Experimental", "Rock"], 55, 2200000),
  b("Spoon", ["Indie Rock", "Rock", "Alternative"], 62, 3400000),
  b("The Strokes", ["Indie Rock", "Rock", "Alternative"], 76, 14000000),
  b("Arctic Monkeys", ["Indie Rock", "Rock", "Alternative"], 84, 38000000),
  b("Tame Impala", ["Psychedelic Rock", "Electronic", "Alternative"], 80, 24000000),
  b("Glass Animals", ["Indie Rock", "Electronic", "Pop"], 77, 18000000),
  b("Mac DeMarco", ["Indie Rock", "Rock", "Lo-Fi"], 68, 8500000),
  b("King Gizzard & the Lizard Wizard", ["Psychedelic Rock", "Rock", "Experimental"], 64, 4100000),
  b("Dry Cleaning", ["Punk", "Rock", "Alternative"], 50, 1200000),
  b("Black Country, New Road", ["Experimental", "Rock", "Alternative"], 48, 900000),
  b("Squid", ["Punk", "Rock", "Experimental"], 45, 700000),
  b("Shame", ["Punk", "Rock", "Alternative"], 47, 1100000),
  b("IDLES", ["Punk", "Rock", "Alternative"], 60, 2800000),
  b("Parquet Courts", ["Punk", "Indie Rock", "Rock"], 55, 1800000),
  b("Car Seat Headrest", ["Indie Rock", "Rock", "Alternative"], 58, 2500000),
  b("Mitski", ["Indie Rock", "Singer-Songwriter", "Alternative"], 70, 8200000),
  b("Courtney Barnett", ["Indie Rock", "Rock", "Singer-Songwriter"], 62, 2900000),
  b("Angel Olsen", ["Indie Rock", "Singer-Songwriter", "Folk"], 58, 2200000),
  b("Sharon Van Etten", ["Indie Rock", "Singer-Songwriter", "Alternative"], 56, 2000000),
  b("Weyes Blood", ["Indie Rock", "Singer-Songwriter", "Folk"], 58, 2400000),
  b("Soccer Mommy", ["Indie Rock", "Singer-Songwriter", "Alternative"], 55, 2100000),
  b("Clairo", ["Indie Rock", "Pop", "Lo-Fi"], 70, 9800000),
  b("Diiv", ["Indie Rock", "Alternative", "Rock"], 48, 1100000),
  b("Wild Nothing", ["Indie Rock", "Pop", "Alternative"], 50, 1300000),
  b("Real Estate", ["Indie Rock", "Rock", "Alternative"], 52, 1600000),
  b("Whitney", ["Indie Rock", "Folk", "Rock"], 54, 1700000),

  // Folk / Americana / Country (40)
  b("Tyler Childers", ["Country", "Folk", "Americana"], 76, 9200000),
  b("Hozier", ["Folk", "Rock", "Singer-Songwriter"], 82, 28000000),
  b("Maggie Rogers", ["Indie Rock", "Pop", "Folk"], 74, 10000000),
  b("Iron & Wine", ["Folk", "Singer-Songwriter", "Indie Rock"], 62, 4100000),
  b("The Avett Brothers", ["Folk", "Americana", "Rock"], 65, 4800000),
  b("Caamp", ["Indie Rock", "Folk", "Americana"], 68, 5200000),
  b("Mt. Joy", ["Indie Rock", "Folk", "Rock"], 66, 4600000),
  b("Lord Huron", ["Indie Rock", "Folk", "Alternative"], 68, 7800000),
  b("Gregory Alan Isakov", ["Folk", "Singer-Songwriter", "Indie Rock"], 66, 5600000),
  b("The Lumineers", ["Folk", "Rock", "Americana"], 76, 16000000),
  b("Mumford & Sons", ["Folk", "Rock", "Alternative"], 75, 18000000),
  b("Jason Isbell", ["Americana", "Rock", "Singer-Songwriter"], 64, 3400000),
  b("Sturgill Simpson", ["Country", "Rock", "Americana"], 65, 3200000),
  b("Billy Strings", ["Folk", "Americana", "Rock"], 70, 4800000),
  b("Trampled by Turtles", ["Folk", "Americana", "Bluegrass"], 55, 1800000),
  b("The Tallest Man on Earth", ["Folk", "Singer-Songwriter"], 56, 2100000),
  b("Adrianne Lenker", ["Folk", "Singer-Songwriter", "Indie Rock"], 55, 2000000),
  b("Nick Drake", ["Folk", "Singer-Songwriter"], 62, 4500000),
  b("Sufjan Stevens", ["Folk", "Indie Rock", "Electronic"], 68, 7200000),
  b("First Aid Kit", ["Folk", "Singer-Songwriter", "Country"], 62, 4200000),
  b("Brandi Carlile", ["Folk", "Rock", "Americana"], 68, 5800000),
  b("Chris Stapleton", ["Country", "Blues", "Rock"], 76, 12000000),
  b("Colter Wall", ["Country", "Folk", "Americana"], 62, 4100000),
  b("Sierra Ferrell", ["Country", "Folk", "Americana"], 58, 2800000),
  b("Charley Crockett", ["Country", "Blues", "Americana"], 60, 3200000),
  b("Zach Bryan", ["Country", "Folk", "Singer-Songwriter"], 82, 32000000),
  b("Noah Kahan", ["Folk", "Pop", "Singer-Songwriter"], 80, 28000000),
  b("Waxahatchee", ["Indie Rock", "Singer-Songwriter", "Alternative"], 60, 2400000),
  b("Pinegrove", ["Indie Rock", "Folk", "Alternative"], 62, 1800000),
  b("The Head and the Heart", ["Folk", "Indie Rock", "Rock"], 65, 5200000),
  b("Dawes", ["Folk", "Rock", "Americana"], 55, 1600000),
  b("Ray LaMontagne", ["Folk", "Singer-Songwriter", "Rock"], 62, 4800000),
  b("Ani DiFranco", ["Folk", "Singer-Songwriter", "Alternative"], 48, 1200000),
  b("Andrew Bird", ["Folk", "Indie Rock", "Singer-Songwriter"], 58, 2600000),
  b("Iron and Wine", ["Folk", "Singer-Songwriter"], 60, 3800000),
  b("Nathaniel Rateliff", ["Folk", "Rock", "Americana"], 65, 4200000),
  b("The Wood Brothers", ["Folk", "Blues", "Americana"], 52, 1400000),
  b("Watchhouse", ["Folk", "Americana", "Bluegrass"], 50, 1100000),
  b("S. Carey", ["Folk", "Singer-Songwriter", "Indie Rock"], 38, 500000),
  b("Hiss Golden Messenger", ["Folk", "Rock", "Americana"], 45, 800000),

  // Rock / Classic (30)
  b("Foo Fighters", ["Rock", "Alternative"], 82, 22000000),
  b("Pearl Jam", ["Rock", "Alternative"], 78, 16000000),
  b("Bruce Springsteen", ["Rock", "Singer-Songwriter"], 82, 18000000),
  b("Jack White", ["Rock", "Blues", "Alternative"], 70, 6200000),
  b("Dave Matthews Band", ["Rock", "Folk", "Jazz"], 72, 7800000),
  b("Greta Van Fleet", ["Rock", "Blues", "Hard Rock"], 72, 11000000),
  b("Turnstile", ["Punk", "Hardcore", "Rock"], 65, 3800000),
  b("Queens of the Stone Age", ["Rock", "Alternative", "Metal"], 70, 8500000),
  b("The Black Keys", ["Rock", "Blues", "Alternative"], 72, 12000000),
  b("Jack Johnson", ["Rock", "Folk", "Acoustic"], 70, 12000000),
  b("The Killers", ["Rock", "Alternative", "Pop"], 78, 20000000),
  b("Muse", ["Rock", "Alternative", "Electronic"], 78, 19000000),
  b("Cage the Elephant", ["Rock", "Alternative", "Indie Rock"], 72, 14000000),
  b("The Black Crowes", ["Rock", "Blues", "Southern Rock"], 62, 4800000),
  b("Tedeschi Trucks Band", ["Blues", "Rock", "Americana"], 60, 2200000),
  b("Gary Clark Jr.", ["Blues", "Rock", "R&B/Soul"], 62, 3600000),
  b("Khruangbin", ["Funk", "Rock", "World Music"], 72, 6800000),
  b("Joe Bonamassa", ["Blues", "Rock"], 55, 2400000),
  b("The Revivalists", ["Rock", "Funk", "Alternative"], 60, 3800000),
  b("Nathaniel Rateliff & The Night Sweats", ["Rock", "R&B/Soul", "Americana"], 64, 4200000),
  b("Marcus King", ["Rock", "Blues", "Singer-Songwriter"], 58, 2800000),
  b("St. Vincent", ["Rock", "Alternative", "Art Rock"], 62, 3200000),
  b("Sleater-Kinney", ["Rock", "Punk", "Alternative"], 52, 1400000),
  b("Yeah Yeah Yeahs", ["Rock", "Punk", "Alternative"], 58, 3400000),
  b("Dinosaur Jr.", ["Rock", "Alternative", "Indie Rock"], 52, 1600000),
  b("Guided by Voices", ["Rock", "Indie Rock", "Lo-Fi"], 42, 600000),
  b("Built to Spill", ["Rock", "Indie Rock", "Alternative"], 48, 1100000),
  b("The Breeders", ["Rock", "Alternative", "Indie Rock"], 50, 1400000),
  b("Pixies", ["Rock", "Alternative", "Indie Rock"], 68, 7800000),
  b("Sonic Youth", ["Rock", "Experimental", "Alternative"], 55, 3200000),

  // Pop / Pop-Rock (25)
  b("Taylor Swift", ["Pop", "Country", "Singer-Songwriter"], 99, 82000000),
  b("Billie Eilish", ["Pop", "Alternative", "Electronic"], 93, 62000000),
  b("Kendrick Lamar", ["Hip-Hop", "R&B/Soul"], 92, 48000000),
  b("SZA", ["R&B/Soul", "Pop", "Hip-Hop"], 88, 42000000),
  b("Tyler, the Creator", ["Hip-Hop", "R&B/Soul", "Alternative"], 85, 35000000),
  b("Frank Ocean", ["R&B/Soul", "Pop", "Hip-Hop"], 82, 22000000),
  b("Lorde", ["Pop", "Alternative", "Electronic"], 74, 14000000),
  b("Florence + The Machine", ["Rock", "Pop", "Alternative"], 74, 16000000),
  b("Lana Del Rey", ["Pop", "Alternative", "Singer-Songwriter"], 82, 32000000),
  b("Olivia Rodrigo", ["Pop", "Rock", "Alternative"], 88, 45000000),
  b("Gracie Abrams", ["Pop", "Singer-Songwriter", "Indie Rock"], 75, 18000000),
  b("Remi Wolf", ["Pop", "Funk", "Alternative"], 60, 4200000),
  b("Samia", ["Indie Rock", "Pop", "Singer-Songwriter"], 42, 800000),
  b("Chappell Roan", ["Pop", "Rock", "Alternative"], 85, 38000000),
  b("Sabrina Carpenter", ["Pop", "R&B/Soul"], 88, 50000000),
  b("The 1975", ["Pop", "Rock", "Alternative"], 76, 16000000),
  b("Charli XCX", ["Pop", "Electronic", "Alternative"], 80, 22000000),
  b("Haim", ["Pop", "Rock", "Alternative"], 64, 5200000),
  b("Maggie Rogers", ["Pop", "Folk", "Indie Rock"], 72, 9500000),
  b("Faye Webster", ["Indie Rock", "Pop", "Country"], 58, 3200000),
  b("Ethel Cain", ["Singer-Songwriter", "Alternative", "Folk"], 55, 2800000),
  b("Beabadoobee", ["Indie Rock", "Pop", "Alternative"], 68, 8200000),
  b("Rina Sawayama", ["Pop", "Rock", "R&B/Soul"], 58, 3800000),
  b("Caroline Polachek", ["Pop", "Electronic", "Alternative"], 58, 3200000),
  b("Japanese House", ["Pop", "Electronic", "Indie Rock"], 52, 2200000),

  // Jazz / World / Experimental (30)
  b("Kamasi Washington", ["Jazz", "Experimental"], 55, 1800000),
  b("Snarky Puppy", ["Jazz", "Funk", "World Music"], 58, 2200000),
  b("Mdou Moctar", ["Rock", "World Music", "Experimental"], 52, 1200000),
  b("Black Midi", ["Experimental", "Rock", "Punk"], 50, 900000),
  b("Dan Deacon", ["Electronic", "Experimental"], 45, 600000),
  b("Lower Dens", ["Indie Rock", "Electronic", "Alternative"], 40, 400000),
  b("JPEGMAFIA", ["Hip-Hop", "Experimental", "Electronic"], 62, 3800000),
  b("Goose", ["Rock", "Indie Rock", "Experimental"], 62, 2800000),
  b("Nubya Garcia", ["Jazz", "Electronic"], 42, 500000),
  b("Shabaka", ["Jazz", "Experimental", "World Music"], 40, 350000),
  b("Thundercat", ["Jazz", "Funk", "R&B/Soul"], 62, 4200000),
  b("Robert Glasper", ["Jazz", "R&B/Soul", "Hip-Hop"], 52, 1800000),
  b("Christian Scott aTunde Adjuah", ["Jazz", "Experimental"], 40, 400000),
  b("Makaya McCraven", ["Jazz", "Experimental", "Electronic"], 42, 500000),
  b("BadBadNotGood", ["Jazz", "Electronic", "Hip-Hop"], 55, 2100000),
  b("Hiatus Kaiyote", ["Jazz", "R&B/Soul", "Experimental"], 52, 1500000),
  b("Cory Wong", ["Funk", "Jazz", "Rock"], 50, 1200000),
  b("Vulfpeck", ["Funk", "Rock", "Jazz"], 60, 3200000),
  b("Lettuce", ["Funk", "Jazz", "R&B/Soul"], 48, 1000000),
  b("Galactic", ["Funk", "Jazz", "Rock"], 48, 900000),
  b("Greensky Bluegrass", ["Bluegrass", "Folk", "Americana"], 50, 1200000),
  b("Punch Brothers", ["Bluegrass", "Folk", "Americana"], 48, 900000),
  b("Bela Fleck", ["Bluegrass", "Jazz", "World Music"], 48, 800000),
  b("Trombone Shorty", ["Jazz", "Funk", "Rock"], 52, 1200000),
  b("Tank and the Bangas", ["R&B/Soul", "Hip-Hop", "Funk"], 48, 800000),
  b("Lake Street Dive", ["Pop", "Jazz", "Folk"], 58, 2200000),
  b("Samara Joy", ["Jazz", "Singer-Songwriter"], 52, 1800000),
  b("Jacob Collier", ["Jazz", "Pop", "Electronic"], 62, 4200000),
  b("Esperanza Spalding", ["Jazz", "R&B/Soul", "Experimental"], 48, 1100000),
  b("Cimafunk", ["Funk", "R&B/Soul", "World Music"], 40, 400000),

  // Electronic / EDM (25)
  b("Four Tet", ["Electronic", "Experimental", "Ambient"], 62, 4800000),
  b("Jamie xx", ["Electronic", "House", "Alternative"], 65, 5600000),
  b("Floating Points", ["Electronic", "Experimental", "Jazz"], 50, 1200000),
  b("Bonobo", ["Electronic", "Ambient", "World Music"], 62, 4200000),
  b("Caribou", ["Electronic", "Indie Rock", "Experimental"], 58, 3200000),
  b("Nicolas Jaar", ["Electronic", "Experimental", "Ambient"], 52, 1800000),
  b("Tycho", ["Electronic", "Ambient", "Indie Rock"], 58, 3800000),
  b("Sylvan Esso", ["Electronic", "Folk", "Pop"], 58, 2400000),
  b("Odesza", ["Electronic", "Pop", "Ambient"], 72, 10000000),
  b("Rufus Du Sol", ["Electronic", "Alternative", "Pop"], 72, 8800000),
  b("Disclosure", ["Electronic", "House", "R&B/Soul"], 68, 7200000),
  b("Kaytranada", ["Electronic", "R&B/Soul", "Hip-Hop"], 68, 6800000),
  b("Fred Again..", ["Electronic", "House", "Pop"], 78, 16000000),
  b("Jon Hopkins", ["Electronic", "Ambient", "Experimental"], 52, 1800000),
  b("Aphex Twin", ["Electronic", "Experimental", "Ambient"], 62, 4800000),
  b("Boards of Canada", ["Electronic", "Ambient", "Experimental"], 50, 1600000),
  b("Thom Yorke", ["Electronic", "Rock", "Experimental"], 62, 3200000),
  b("LCD Soundsystem", ["Electronic", "Rock", "Dance"], 62, 4200000),
  b("Hot Chip", ["Electronic", "Pop", "Dance"], 55, 2200000),
  b("Roisin Murphy", ["Electronic", "Pop", "Dance"], 50, 1400000),
  b("Peggy Gou", ["Electronic", "House", "Dance"], 58, 3200000),
  b("Bicep", ["Electronic", "House", "Dance"], 62, 4200000),
  b("Moderat", ["Electronic", "Experimental", "Dance"], 52, 2000000),
  b("Amon Tobin", ["Electronic", "Experimental", "Ambient"], 42, 600000),
  b("Little Dragon", ["Electronic", "Pop", "R&B/Soul"], 55, 2800000),
];

// ============================================
// GENERATED ARTISTS (800 more)
// Realistic indie/alternative band names
// ============================================

const genreProfiles = {
  indieRock: { genres: ["Indie Rock", "Alternative", "Rock"], popRange: [25, 55] as [number, number], listenersRange: [100000, 2000000] as [number, number] },
  folkAcoustic: { genres: ["Folk", "Singer-Songwriter", "Acoustic"], popRange: [20, 50] as [number, number], listenersRange: [80000, 1500000] as [number, number] },
  punk: { genres: ["Punk", "Rock", "Alternative"], popRange: [20, 48] as [number, number], listenersRange: [50000, 1200000] as [number, number] },
  electronic: { genres: ["Electronic", "Experimental", "Ambient"], popRange: [20, 50] as [number, number], listenersRange: [60000, 1800000] as [number, number] },
  jazz: { genres: ["Jazz", "Experimental", "Funk"], popRange: [18, 45] as [number, number], listenersRange: [40000, 800000] as [number, number] },
  americana: { genres: ["Americana", "Country", "Folk"], popRange: [22, 52] as [number, number], listenersRange: [70000, 1600000] as [number, number] },
  rnbSoul: { genres: ["R&B/Soul", "Pop", "Hip-Hop"], popRange: [25, 55] as [number, number], listenersRange: [100000, 2200000] as [number, number] },
  metal: { genres: ["Metal", "Rock", "Hard Rock"], popRange: [20, 48] as [number, number], listenersRange: [60000, 1500000] as [number, number] },
  world: { genres: ["World Music", "Folk", "Jazz"], popRange: [18, 42] as [number, number], listenersRange: [30000, 600000] as [number, number] },
  blues: { genres: ["Blues", "Rock", "Americana"], popRange: [20, 48] as [number, number], listenersRange: [50000, 1200000] as [number, number] },
  popAlt: { genres: ["Pop", "Alternative", "Indie Rock"], popRange: [28, 58] as [number, number], listenersRange: [120000, 2500000] as [number, number] },
  lofi: { genres: ["Lo-Fi", "Indie Rock", "Alternative"], popRange: [22, 48] as [number, number], listenersRange: [80000, 1800000] as [number, number] },
};

// Realistic band name parts
const prefixes = [
  "The", "A", "My", "Our", "Young", "Old", "Wild", "Lost", "Dark", "Bright",
  "Northern", "Southern", "Eastern", "Western", "Golden", "Silver", "Black", "White",
  "Red", "Blue", "Green", "Pale", "Deep", "Half", "New", "Dead", "Slow", "Fast",
  "Quiet", "Loud", "Little", "Big", "Tall", "Short", "Late", "Early", "Last", "First",
];

const nouns = [
  "Moon", "Sun", "Stars", "River", "Ocean", "Mountain", "Valley", "Forest", "Desert",
  "Storm", "Rain", "Snow", "Wind", "Fire", "Light", "Shadow", "Echo", "Ghost", "Spirit",
  "Dream", "Memory", "Signal", "Pilot", "Captain", "Anchor", "Harbor", "Bridge", "Tower",
  "Garden", "Meadow", "Canyon", "Prairie", "Island", "Coast", "Shore", "Lake", "Creek",
  "Wolf", "Bear", "Fox", "Hawk", "Raven", "Owl", "Lion", "Tiger", "Deer", "Eagle",
  "Pine", "Oak", "Cedar", "Elm", "Birch", "Willow", "Rose", "Lily", "Ivy", "Fern",
  "Stone", "Iron", "Glass", "Steel", "Copper", "Rust", "Ash", "Dust", "Clay", "Salt",
  "Bell", "Drum", "Horn", "Wire", "Spark", "Flame", "Bloom", "Thorn", "Crown", "Shield",
  "Arrow", "Dagger", "Lantern", "Compass", "Prism", "Mirror", "Orbit", "Haze", "Veil", "Mist",
  "Hollow", "Summit", "Ridge", "Gully", "Ravine", "Glacier", "Spring", "Falls", "Reef", "Tide",
];

const pluralNouns = [
  "Moons", "Stars", "Rivers", "Oceans", "Mountains", "Valleys", "Forests", "Storms",
  "Ghosts", "Dreams", "Memories", "Signals", "Bridges", "Towers", "Gardens", "Islands",
  "Wolves", "Bears", "Foxes", "Hawks", "Ravens", "Owls", "Lions", "Eagles", "Deer",
  "Pines", "Oaks", "Roses", "Stones", "Bells", "Drums", "Sparks", "Flames", "Thorns",
  "Arrows", "Lanterns", "Mirrors", "Orbits", "Tides", "Springs", "Falls", "Embers",
  "Feathers", "Anchors", "Harbors", "Currents", "Whispers", "Echoes", "Shadows",
  "Strangers", "Wanderers", "Travelers", "Drifters", "Seekers", "Builders", "Makers",
];

const adjectives = [
  "Velvet", "Neon", "Crystal", "Cosmic", "Electric", "Phantom", "Hollow", "Amber",
  "Crimson", "Emerald", "Sapphire", "Ivory", "Obsidian", "Vintage", "Modern", "Ancient",
  "Quiet", "Loud", "Soft", "Heavy", "Gentle", "Fierce", "Tender", "Bitter", "Sweet",
  "Frozen", "Burning", "Fading", "Rising", "Falling", "Floating", "Sinking", "Drifting",
  "Broken", "Woven", "Tangled", "Folded", "Scattered", "Gathered", "Buried", "Lifted",
  "Sunlit", "Moonlit", "Starlit", "Twilight", "Midnight", "Dawn", "Dusk", "Daybreak",
];

const suffixes = [
  "Club", "Society", "Collective", "Project", "Assembly", "Union", "Alliance",
  "Machine", "Engine", "Factory", "Workshop", "Station", "System", "Circuit",
  "Express", "Voyage", "Transit", "Passage", "Crossing", "Junction",
];

// Seeded random for deterministic generation
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function generateBandNames(count: number): SeedBand[] {
  const random = seededRandom(42);
  const bands: SeedBand[] = [];
  const usedNames = new Set<string>();
  const usedSlugs = new Set<string>();

  // Add all real artist slugs to prevent collisions
  for (const artist of realArtists) {
    usedSlugs.add(artist.slug);
    usedNames.add(artist.name.toLowerCase());
  }

  const genreKeys = Object.keys(genreProfiles) as (keyof typeof genreProfiles)[];

  const patterns = [
    // "The [Adjective] [Plural Nouns]" — e.g., "The Velvet Moons"
    () => {
      const adj = adjectives[Math.floor(random() * adjectives.length)];
      const noun = pluralNouns[Math.floor(random() * pluralNouns.length)];
      return `The ${adj} ${noun}`;
    },
    // "[Adjective] [Noun]" — e.g., "Crimson Harbor"
    () => {
      const adj = adjectives[Math.floor(random() * adjectives.length)];
      const noun = nouns[Math.floor(random() * nouns.length)];
      return `${adj} ${noun}`;
    },
    // "[Noun] & [Noun]" — e.g., "Wolf & Iron"
    () => {
      const n1 = nouns[Math.floor(random() * nouns.length)];
      const n2 = nouns[Math.floor(random() * nouns.length)];
      if (n1 === n2) return `${n1} & Light`;
      return `${n1} & ${n2}`;
    },
    // "[Prefix] [Noun] [Suffix]" — e.g., "Wild River Express"
    () => {
      const pre = prefixes[Math.floor(random() * prefixes.length)];
      const noun = nouns[Math.floor(random() * nouns.length)];
      return `${pre} ${noun}`;
    },
    // "[Noun] [Noun]" — e.g., "Ghost River"
    () => {
      const n1 = nouns[Math.floor(random() * nouns.length)];
      const n2 = nouns[Math.floor(random() * nouns.length)];
      if (n1 === n2) return `${n1} Bay`;
      return `${n1} ${n2}`;
    },
    // "The [Nouns]" — e.g., "The Ravens"
    () => {
      const noun = pluralNouns[Math.floor(random() * pluralNouns.length)];
      return `The ${noun}`;
    },
    // "[Adjective] [Suffix]" — e.g., "Cosmic Machine"
    () => {
      const adj = adjectives[Math.floor(random() * adjectives.length)];
      const suf = suffixes[Math.floor(random() * suffixes.length)];
      return `${adj} ${suf}`;
    },
    // Single evocative word
    () => {
      const word = nouns[Math.floor(random() * nouns.length)];
      return word;
    },
  ];

  let attempts = 0;
  while (bands.length < count && attempts < count * 5) {
    attempts++;
    const pattern = patterns[Math.floor(random() * patterns.length)];
    const name = pattern();
    const s = slug(name);

    if (usedNames.has(name.toLowerCase()) || usedSlugs.has(s) || s.length < 3) continue;

    usedNames.add(name.toLowerCase());
    usedSlugs.add(s);

    // Assign genre profile
    const genreKey = genreKeys[Math.floor(random() * genreKeys.length)];
    const profile = genreProfiles[genreKey];

    // Shuffle genres a bit — pick 2-3 from the profile genres
    const numGenres = 2 + Math.floor(random() * 2);
    const shuffledGenres = [...profile.genres].sort(() => random() - 0.5).slice(0, numGenres);

    const pop = profile.popRange[0] + Math.floor(random() * (profile.popRange[1] - profile.popRange[0]));
    const listeners = profile.listenersRange[0] + Math.floor(random() * (profile.listenersRange[1] - profile.listenersRange[0]));

    bands.push(b(name, shuffledGenres, pop, listeners));
  }

  return bands;
}

const generatedBands = generateBandNames(800);

export const allBands: SeedBand[] = [...realArtists, ...generatedBands];

// All unique genres across the dataset
export const allGenres = [...new Set(allBands.flatMap((b) => b.genres))].sort();
