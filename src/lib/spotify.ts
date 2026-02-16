/**
 * Spotify API integration — data import only (not a login provider).
 *
 * Uses the Authorization Code Flow to fetch a user's top artists
 * and match them against the DAB band catalog.
 */

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

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
// Client Credentials (server-to-server, no user auth)
// Used for searching artists in the Spotify catalog
// ------------------------------------

let clientToken: { accessToken: string; expiresAt: number } | null = null;

async function getClientCredentialsToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (clientToken && Date.now() < clientToken.expiresAt - 60_000) {
    return clientToken.accessToken;
  }

  const basicAuth = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) {
    throw new Error(`Spotify client credentials failed: ${res.status}`);
  }

  const data = await res.json();
  clientToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return clientToken.accessToken;
}

/**
 * Search for an artist on Spotify by name.
 * Uses Client Credentials flow (no user auth needed).
 * Returns the best match or null.
 */
export async function searchSpotifyArtist(
  name: string
): Promise<SpotifyArtist | null> {
  if (!isSpotifyConfigured()) return null;

  try {
    const token = await getClientCredentialsToken();
    const params = new URLSearchParams({
      q: name,
      type: "artist",
      limit: "5",
    });

    const res = await fetch(`${SPOTIFY_API_BASE}/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const artists: SpotifyArtistRaw[] = data.artists?.items || [];

    if (artists.length === 0) return null;

    // Find best match — exact name match preferred, then closest match
    const exactMatch = artists.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    const best = exactMatch || artists[0];

    return {
      spotifyId: best.id,
      name: best.name,
      genres: best.genres || [],
      popularity: best.popularity || 0,
      imageUrl: best.images?.[0]?.url || null,
      spotifyUrl: best.external_urls?.spotify || `https://open.spotify.com/artist/${best.id}`,
    };
  } catch (err) {
    console.error(`[Spotify] Search failed for "${name}":`, err);
    return null;
  }
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
// (Auto-creates bands for unmatched Spotify artists)
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
  newlyCreated: number;
  alreadyExisted: number;
}

export async function matchArtistsToCatalog(
  spotifyArtists: SpotifyArtist[]
): Promise<MatchResult> {
  if (spotifyArtists.length === 0) {
    return { matched: [], newlyCreated: 0, alreadyExisted: 0 };
  }

  const spotifyIds = spotifyArtists.map((a) => a.spotifyId);

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
  const unmatchedAfterIds = spotifyArtists.filter(
    (a) => !matchedSpotifyIds.has(a.spotifyId)
  );

  let nameMatches: typeof idMatches = [];
  if (unmatchedAfterIds.length > 0) {
    const unmatchedNames = unmatchedAfterIds.map((a) => a.name);

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

  // Collect all existing matches
  const allMatchedIds = new Set<string>();
  const allMatchedSpotifyIds = new Set<string>();
  const allMatched: MatchResult["matched"] = [];

  for (const band of [...idMatches, ...nameMatches]) {
    if (!allMatchedIds.has(band.id)) {
      allMatchedIds.add(band.id);
      if (band.spotifyId) allMatchedSpotifyIds.add(band.spotifyId);
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

  // Also collect name-matched Spotify IDs (for bands matched by name, not ID)
  const nameMatchedNames = new Set(nameMatches.map((b) => b.name.toLowerCase()));

  const alreadyExisted = allMatched.length;

  // Strategy 3: Auto-create bands for unmatched Spotify artists
  const stillUnmatched = spotifyArtists.filter(
    (a) =>
      !allMatchedSpotifyIds.has(a.spotifyId) &&
      !nameMatchedNames.has(a.name.toLowerCase())
  );

  if (stillUnmatched.length > 0) {
    console.log(
      `[Spotify] Auto-creating ${stillUnmatched.length} new bands from Spotify import`
    );

    for (const artist of stillUnmatched) {
      try {
        // Generate a unique slug
        let baseSlug = slugify(artist.name);
        let slug = baseSlug;
        let attempt = 0;

        // Check for slug collisions
        while (true) {
          const existing = await prisma.band.findUnique({
            where: { slug },
            select: { id: true },
          });
          if (!existing) break;
          attempt++;
          slug = `${baseSlug}-${attempt}`;
        }

        const newBand = await prisma.band.create({
          data: {
            name: artist.name,
            slug,
            genres: artist.genres,
            imageUrl: artist.imageUrl,
            spotifyId: artist.spotifyId,
            spotifyUrl: artist.spotifyUrl || `https://open.spotify.com/artist/${artist.spotifyId}`,
            popularity: artist.popularity,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            genres: true,
            imageUrl: true,
            popularity: true,
          },
        });

        allMatched.push(newBand);
      } catch (err) {
        // Skip if creation fails (e.g., unique constraint on spotifyId)
        console.error(
          `[Spotify] Failed to create band for "${artist.name}":`,
          err
        );
      }
    }
  }

  return {
    matched: allMatched,
    newlyCreated: allMatched.length - alreadyExisted,
    alreadyExisted,
  };
}
