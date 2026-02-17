/**
 * AI-powered genre normalization.
 *
 * Maps Spotify's granular genre labels (e.g., "southern soul", "swamp blues")
 * to the app's 19 canonical genres that users pick during onboarding.
 *
 * Strategy: AI first (gpt-4o-mini via Vercel AI SDK), deterministic fallback.
 */

import { GENRES } from "@/lib/constants";

// Build a Set for O(1) canonical genre lookups
const CANONICAL_SET = new Set<string>(GENRES);

// ------------------------------------
// Deterministic keyword-based fallback
// ------------------------------------

const GENRE_KEYWORDS: Record<string, string[]> = {
  Alternative: [
    "alternative",
    "alt-",
    "dream pop",
    "shoegaze",
    "post-punk",
    "new wave",
    "britpop",
    "madchester",
    "noise pop",
    "slowcore",
    "post-rock",
  ],
  Americana: [
    "americana",
    "roots",
    "alt-country",
    "outlaw country",
    "red dirt",
    "texas country",
  ],
  Blues: [
    "blues",
    "delta blues",
    "chicago blues",
    "swamp blues",
    "electric blues",
    "piedmont blues",
    "texas blues",
    "blues rock",
  ],
  Classical: [
    "classical",
    "orchestra",
    "chamber",
    "baroque",
    "symphony",
    "opera",
    "choral",
    "romantic era",
  ],
  Country: [
    "country",
    "nashville",
    "honky tonk",
    "bluegrass",
    "bro-country",
    "country rock",
    "western",
  ],
  Electronic: [
    "electronic",
    "edm",
    "techno",
    "house",
    "ambient",
    "synthwave",
    "synthpop",
    "trance",
    "dubstep",
    "drum and bass",
    "lo-fi beats",
    "idm",
    "downtempo",
    "electronica",
    "chillwave",
  ],
  Experimental: [
    "experimental",
    "avant-garde",
    "noise",
    "art rock",
    "musique concrete",
    "glitch",
    "drone",
  ],
  Folk: [
    "folk",
    "traditional",
    "celtic",
    "appalachian",
    "folk rock",
    "neofolk",
    "folk pop",
    "chamber folk",
  ],
  Funk: ["funk", "p-funk", "deep funk", "go-go", "electro-funk", "boogie"],
  "Hip-Hop": [
    "hip hop",
    "hip-hop",
    "rap",
    "trap",
    "boom bap",
    "grime",
    "drill",
    "conscious hip hop",
    "gangsta rap",
    "dirty south",
  ],
  "Indie Rock": [
    "indie rock",
    "indie",
    "lo-fi rock",
    "garage rock",
    "math rock",
    "emo",
    "midwest emo",
    "indie pop",
    "jangle pop",
    "c86",
  ],
  Jazz: [
    "jazz",
    "bebop",
    "swing",
    "fusion",
    "smooth jazz",
    "free jazz",
    "bossa nova",
    "cool jazz",
    "hard bop",
    "post-bop",
    "acid jazz",
    "jazz funk",
    "big band",
  ],
  Metal: [
    "metal",
    "death metal",
    "black metal",
    "doom metal",
    "thrash",
    "metalcore",
    "deathcore",
    "djent",
    "prog metal",
    "heavy metal",
    "nu metal",
    "grindcore",
    "stoner metal",
    "sludge metal",
    "power metal",
    "speed metal",
  ],
  Pop: [
    "pop",
    "synth-pop",
    "dance pop",
    "electropop",
    "art pop",
    "power pop",
    "bubblegum",
    "teen pop",
    "europop",
    "k-pop",
    "j-pop",
  ],
  Punk: [
    "punk",
    "hardcore",
    "post-hardcore",
    "skate punk",
    "pop punk",
    "anarcho-punk",
    "crust punk",
    "straight edge",
    "ska punk",
  ],
  "R&B/Soul": [
    "r&b",
    "rnb",
    "soul",
    "neo-soul",
    "neo soul",
    "motown",
    "gospel",
    "doo-wop",
    "contemporary r&b",
    "quiet storm",
    "southern soul",
    "northern soul",
    "philly soul",
    "new jack swing",
  ],
  Rock: [
    "rock",
    "classic rock",
    "hard rock",
    "psychedelic rock",
    "prog rock",
    "grunge",
    "southern rock",
    "arena rock",
    "stadium rock",
    "soft rock",
    "heartland rock",
    "glam rock",
    "stoner rock",
    "jam band",
    "jam",
  ],
  "Singer-Songwriter": [
    "singer-songwriter",
    "singer/songwriter",
    "songwriter",
    "confessional",
    "acoustic",
    "troubadour",
  ],
  "World Music": [
    "world",
    "afrobeat",
    "reggae",
    "latin",
    "cumbia",
    "ska",
    "dub",
    "flamenco",
    "klezmer",
    "samba",
    "bhangra",
    "afro",
    "caribbean",
    "tropicalia",
    "highlife",
    "zouk",
    "mbalax",
    "soca",
    "calypso",
    "bossa",
    "fado",
    "mariachi",
    "norteño",
    "salsa",
    "merengue",
    "bachata",
    "dancehall",
    "roots reggae",
  ],
};

/**
 * Deterministic genre mapping using keyword/substring matching.
 * Used as fallback when AI is unavailable.
 */
export function mapGenresDeterministic(spotifyGenres: string[]): string[] {
  const matched = new Set<string>();

  for (const spotifyGenre of spotifyGenres) {
    const lower = spotifyGenre.toLowerCase();

    for (const [canonical, keywords] of Object.entries(GENRE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword) || keyword.includes(lower)) {
          matched.add(canonical);
        }
      }
    }
  }

  return Array.from(matched);
}

// ------------------------------------
// AI-powered mapping via Vercel AI SDK
// ------------------------------------

async function mapGenresWithAI(spotifyGenres: string[]): Promise<string[]> {
  // Dynamic imports to avoid loading AI SDK at startup if not needed
  const { generateObject } = await import("ai");
  const { openai } = await import("@ai-sdk/openai");
  const { z } = await import("zod");

  const genreValues = GENRES as unknown as [string, ...string[]];

  const GenreMapSchema = z.object({
    canonicalGenres: z.array(z.enum(genreValues)),
  });

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: GenreMapSchema,
    prompt: `You are a music genre classifier. Map these Spotify genre labels to one or more canonical genres from the allowed list.

Spotify genres: ${spotifyGenres.join(", ")}

Allowed canonical genres: ${GENRES.join(", ")}

Rules:
- Each Spotify genre should map to the CLOSEST canonical genre(s).
- Return only genres from the allowed list.
- A band can belong to multiple canonical genres.
- Be inclusive — if a Spotify genre has any reasonable overlap with a canonical genre, include it.
- Examples: "southern soul" → R&B/Soul, "swamp blues" → Blues, "jam band" → Rock, "deep funk revival" → Funk`,
  });

  return object.canonicalGenres;
}

// ------------------------------------
// Main entry point
// ------------------------------------

/**
 * Normalize Spotify genre labels to the app's canonical genre list.
 *
 * Strategy:
 * 1. If all genres are already canonical → return as-is
 * 2. Try AI mapping (gpt-4o-mini) → structured output constrained to canonical list
 * 3. Fall back to deterministic keyword matching
 * 4. Return empty array if nothing matches
 */
export async function normalizeGenres(
  spotifyGenres: string[]
): Promise<string[]> {
  // Empty input → empty output
  if (!spotifyGenres || spotifyGenres.length === 0) {
    return [];
  }

  // Short-circuit: if all genres are already canonical, just deduplicate and return
  if (spotifyGenres.every((g) => CANONICAL_SET.has(g))) {
    return [...new Set(spotifyGenres)];
  }

  // Try AI mapping first (if API key is configured)
  if (process.env.OPENAI_API_KEY) {
    try {
      const aiResult = await mapGenresWithAI(spotifyGenres);
      if (aiResult.length > 0) {
        console.log(
          `[Genre Normalization] AI mapped [${spotifyGenres.join(", ")}] → [${aiResult.join(", ")}]`
        );
        return [...new Set(aiResult)];
      }
    } catch (err) {
      console.warn(
        "[Genre Normalization] AI mapping failed, falling back to deterministic:",
        err
      );
    }
  }

  // Deterministic fallback
  const result = mapGenresDeterministic(spotifyGenres);
  if (result.length > 0) {
    console.log(
      `[Genre Normalization] Deterministic mapped [${spotifyGenres.join(", ")}] → [${result.join(", ")}]`
    );
  } else {
    console.log(
      `[Genre Normalization] No match for [${spotifyGenres.join(", ")}]`
    );
  }

  return result;
}
