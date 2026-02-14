/**
 * Spotify API integration — data import only (not a login provider).
 *
 * Uses the Authorization Code Flow to fetch a user's top artists
 * and match them against the DAB band catalog.
 */

import { prisma } from "@/lib/prisma";

// ------------------------------------
// Configuration
// ------------------------------------

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const SPOTIFY_REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/spotify/callback`;

const SPOTIFY_SCOPES = "user-top-read";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export function isSpotifyConfigured(): boolean {
  return !!SPOTIFY_CLIENT_ID && !!SPOTIFY_CLIENT_SECRET;
}

// ------------------------------------
// OAuth URL builder
// ------------------------------------

export function buildSpotifyAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: SPOTIFY_SCOPES,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
    show_dialog: "true",
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

// ------------------------------------
// Token exchange
// ------------------------------------

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<SpotifyTokens> {
  const basicAuth = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify token exchange failed: ${err}`);
  }

  return res.json();
}

// ------------------------------------
// Fetch top artists
// ------------------------------------

export interface SpotifyArtist {
  spotifyId: string;
  name: string;
  genres: string[];
  imageUrl: string | null;
  popularity: number;
  spotifyUrl: string;
}

interface SpotifyArtistRaw {
  id: string;
  name: string;
  genres?: string[];
  popularity?: number;
  images?: Array<{ url: string; width: number; height: number }>;
  external_urls?: { spotify?: string };
}

/**
 * Fetch user's top artists across all 3 time ranges, dedup by Spotify ID.
 * Returns up to ~150 unique artists.
 */
export async function fetchTopArtists(
  accessToken: string
): Promise<SpotifyArtist[]> {
  const timeRanges = ["short_term", "medium_term", "long_term"] as const;
  const seen = new Map<string, SpotifyArtist>();

  for (const timeRange of timeRanges) {
    try {
      const res = await fetch(
        `${SPOTIFY_API_BASE}/me/top/artists?time_range=${timeRange}&limit=50`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const items: SpotifyArtistRaw[] = data.items || [];

      for (const artist of items) {
        if (!seen.has(artist.id)) {
          seen.set(artist.id, {
            spotifyId: artist.id,
            name: artist.name,
            genres: artist.genres || [],
            popularity: artist.popularity || 0,
            imageUrl: artist.images?.[0]?.url || null,
            spotifyUrl: artist.external_urls?.spotify || "",
          });
        }
      }
    } catch (err) {
      console.error(`Failed to fetch top artists for ${timeRange}:`, err);
    }
  }

  return Array.from(seen.values());
}

// ------------------------------------
// Get Spotify user ID (for Account model)
// ------------------------------------

export async function getSpotifyUserId(
  accessToken: string
): Promise<string> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Spotify user profile");
  }

  const data = await res.json();
  return data.id;
}

// ------------------------------------
// Match artists to DAB catalog
// ------------------------------------

interface MatchResult {
  matched: Array<{
    id: string;
    name: string;
    slug: string;
    genres: string[];
    imageUrl: string | null;
    popularity: number | null;
  }>;
  unmatchedCount: number;
}

export async function matchArtistsToCatalog(
  spotifyArtists: SpotifyArtist[]
): Promise<MatchResult> {
  if (spotifyArtists.length === 0) {
    return { matched: [], unmatchedCount: 0 };
  }

  const spotifyIds = spotifyArtists.map((a) => a.spotifyId);
  const spotifyNames = spotifyArtists.map((a) => a.name.toLowerCase());

  // Strategy 1: Exact match by Spotify ID
  const idMatches = await prisma.band.findMany({
    where: {
      spotifyId: { in: spotifyIds },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      genres: true,
      imageUrl: true,
      popularity: true,
      spotifyId: true,
    },
  });

  const matchedSpotifyIds = new Set(
    idMatches.map((b) => b.spotifyId).filter(Boolean)
  );

  // Strategy 2: Case-insensitive name match for remaining
  const unmatchedArtists = spotifyArtists.filter(
    (a) => !matchedSpotifyIds.has(a.spotifyId)
  );

  let nameMatches: typeof idMatches = [];
  if (unmatchedArtists.length > 0) {
    // Get all bands and match by lowercased name
    // (Prisma doesn't support IN + mode: insensitive, so we do it in batches)
    const unmatchedNames = unmatchedArtists.map((a) => a.name);

    // Use OR query with individual name checks
    nameMatches = await prisma.band.findMany({
      where: {
        OR: unmatchedNames.map((name) => ({
          name: { equals: name, mode: "insensitive" as const },
        })),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        genres: true,
        imageUrl: true,
        popularity: true,
        spotifyId: true,
      },
    });
  }

  // Combine and deduplicate
  const allMatchedIds = new Set<string>();
  const allMatched: MatchResult["matched"] = [];

  for (const band of [...idMatches, ...nameMatches]) {
    if (!allMatchedIds.has(band.id)) {
      allMatchedIds.add(band.id);
      allMatched.push({
        id: band.id,
        name: band.name,
        slug: band.slug,
        genres: band.genres,
        imageUrl: band.imageUrl,
        popularity: band.popularity,
      });
    }
  }

  const totalUnmatched = spotifyArtists.length - allMatched.length;

  return {
    matched: allMatched,
    unmatchedCount: Math.max(0, totalUnmatched),
  };
}
