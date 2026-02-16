/**
 * Enrich bands that are missing Spotify data.
 * Searches Spotify for each band by name and updates with real data.
 *
 * Run with: npx tsx scripts/enrich-bands-spotify.ts
 */

import path from "node:path";
import fs from "node:fs";

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

let accessToken: string | null = null;

async function getToken(): Promise<string> {
  if (accessToken) return accessToken;

  const basicAuth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const data = await res.json();
  accessToken = data.access_token;
  return accessToken!;
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: Array<{ url: string }>;
  external_urls: { spotify: string };
  followers: { total: number };
}

async function searchArtist(name: string): Promise<SpotifyArtist | null> {
  const token = await getToken();
  const params = new URLSearchParams({ q: name, type: "artist", limit: "5" });
  const res = await fetch(`${SPOTIFY_API_BASE}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  const artists: SpotifyArtist[] = data.artists?.items || [];
  if (artists.length === 0) return null;

  // Prefer exact name match
  const exact = artists.find((a) => a.name.toLowerCase() === name.toLowerCase());
  return exact || artists[0];
}

async function main() {
  console.log("🎵 Enriching bands with Spotify data...\n");

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error("❌ SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set");
    process.exit(1);
  }

  // Find bands missing Spotify data
  const bandsToEnrich = await prisma.band.findMany({
    where: { spotifyId: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${bandsToEnrich.length} bands without Spotify data\n`);

  let enriched = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < bandsToEnrich.length; i++) {
    const band = bandsToEnrich[i];

    try {
      const artist = await searchArtist(band.name);

      if (!artist) {
        console.log(`  ⚠️  No Spotify match: ${band.name}`);
        notFound++;
        continue;
      }

      // Check if this spotifyId already exists on another band
      const existing = await prisma.band.findUnique({
        where: { spotifyId: artist.id },
        select: { id: true, name: true },
      });

      if (existing && existing.id !== band.id) {
        console.log(`  ⚠️  Spotify ID collision: ${band.name} → ${artist.name} (already used by ${existing.name})`);
        notFound++;
        continue;
      }

      await prisma.band.update({
        where: { id: band.id },
        data: {
          spotifyId: artist.id,
          spotifyUrl: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`,
          genres: artist.genres.length > 0 ? artist.genres : undefined,
          popularity: artist.popularity,
          monthlyListeners: artist.followers?.total || null,
          imageUrl: artist.images?.[0]?.url || undefined,
        },
      });

      console.log(`  ✅ ${band.name} → ${artist.name} (pop: ${artist.popularity}, genres: ${artist.genres.slice(0, 3).join(", ")})`);
      enriched++;
    } catch (err) {
      console.error(`  ❌ Error for ${band.name}:`, err);
      errors++;
    }

    // Rate limit
    if (i > 0 && i % 2 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  Enriched: ${enriched}`);
  console.log(`  Not found on Spotify: ${notFound}`);
  console.log(`  Errors: ${errors}`);

  const totalWithSpotify = await prisma.band.count({ where: { spotifyId: { not: null } } });
  const totalBands = await prisma.band.count();
  console.log(`\n  Total bands: ${totalBands} (${totalWithSpotify} with Spotify data)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
