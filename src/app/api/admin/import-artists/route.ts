import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { searchSpotifyArtist, isSpotifyConfigured } from "@/lib/spotify";
import { slugify } from "@/lib/utils";

/**
 * POST /api/admin/import-artists
 *
 * Imports real artists into the Band table by:
 * 1. Getting all unique artist names from cached ExternalEvents
 * 2. Filtering out artists already in the Band table
 * 3. Searching Spotify for each unmatched artist
 * 4. Creating Band records with Spotify data (genres, popularity, image, etc.)
 *
 * Admin-only endpoint. Returns progress stats.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSpotifyConfigured()) {
    return NextResponse.json(
      { error: "Spotify is not configured (missing SPOTIFY_CLIENT_ID/SECRET)" },
      { status: 400 }
    );
  }

  try {
    // 1. Get all unique artist names from external events
    const externalArtists = await prisma.externalEvent.findMany({
      select: { artistName: true },
      distinct: ["artistName"],
    });

    const uniqueNames = [
      ...new Set(externalArtists.map((e) => e.artistName.trim())),
    ].filter((name) => name.length > 0);

    console.log(`[Import] Found ${uniqueNames.length} unique artists from external events`);

    // 2. Get all existing band names (case-insensitive lookup)
    const existingBands = await prisma.band.findMany({
      select: { name: true, spotifyId: true },
    });
    const existingNamesLower = new Set(
      existingBands.map((b) => b.name.toLowerCase())
    );

    // Filter to only new artists
    const newArtistNames = uniqueNames.filter(
      (name) => !existingNamesLower.has(name.toLowerCase())
    );

    console.log(`[Import] ${newArtistNames.length} artists not yet in Band table`);

    if (newArtistNames.length === 0) {
      return NextResponse.json({
        message: "All external event artists are already in the database",
        totalExternal: uniqueNames.length,
        alreadyExisted: uniqueNames.length,
        imported: 0,
        failed: 0,
      });
    }

    // 3. Search Spotify and create Band records
    let imported = 0;
    let failed = 0;
    let skippedDuplicate = 0;
    const importedNames: string[] = [];

    for (let i = 0; i < newArtistNames.length; i++) {
      const artistName = newArtistNames[i];

      try {
        // Search Spotify
        const spotifyArtist = await searchSpotifyArtist(artistName);

        if (!spotifyArtist) {
          // No Spotify match — create a basic band record without Spotify data
          const slug = await generateUniqueSlug(artistName);
          await prisma.band.create({
            data: {
              name: artistName,
              slug,
              genres: [],
              popularity: null,
            },
          });
          imported++;
          importedNames.push(artistName);
          continue;
        }

        // Check if this Spotify artist already exists (by spotifyId)
        if (spotifyArtist.spotifyId) {
          const existingBySpotifyId = await prisma.band.findUnique({
            where: { spotifyId: spotifyArtist.spotifyId },
            select: { id: true },
          });
          if (existingBySpotifyId) {
            skippedDuplicate++;
            continue;
          }
        }

        // Also check by Spotify name (it might differ from the event artist name)
        if (existingNamesLower.has(spotifyArtist.name.toLowerCase())) {
          skippedDuplicate++;
          continue;
        }

        // Create the band
        const slug = await generateUniqueSlug(spotifyArtist.name);
        await prisma.band.create({
          data: {
            name: spotifyArtist.name,
            slug,
            genres: spotifyArtist.genres,
            imageUrl: spotifyArtist.imageUrl,
            spotifyId: spotifyArtist.spotifyId,
            spotifyUrl: spotifyArtist.spotifyUrl,
            popularity: spotifyArtist.popularity,
          },
        });

        // Track the name so we don't duplicate within this batch
        existingNamesLower.add(spotifyArtist.name.toLowerCase());
        imported++;
        importedNames.push(spotifyArtist.name);
      } catch (err) {
        console.error(`[Import] Failed for "${artistName}":`, err);
        failed++;
      }

      // Rate limit: ~2 Spotify requests per second
      if (i > 0 && i % 2 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Log progress every 50 artists
      if ((i + 1) % 50 === 0) {
        console.log(
          `[Import] Progress: ${i + 1}/${newArtistNames.length} (imported: ${imported}, failed: ${failed})`
        );
      }
    }

    console.log(
      `[Import] Complete: ${imported} imported, ${failed} failed, ${skippedDuplicate} skipped (already existed)`
    );

    return NextResponse.json({
      message: `Successfully imported ${imported} new artists from external events`,
      totalExternal: uniqueNames.length,
      alreadyExisted: uniqueNames.length - newArtistNames.length,
      imported,
      failed,
      skippedDuplicate,
      importedNames: importedNames.slice(0, 50), // Show first 50 names
    });
  } catch (error) {
    console.error("[Import] Error:", error);
    return NextResponse.json(
      { error: "Failed to import artists" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/import-artists
 *
 * Preview: shows how many artists would be imported (dry run)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const externalArtists = await prisma.externalEvent.findMany({
      select: { artistName: true },
      distinct: ["artistName"],
    });

    const uniqueNames = [
      ...new Set(externalArtists.map((e) => e.artistName.trim())),
    ].filter((name) => name.length > 0);

    const existingBands = await prisma.band.findMany({
      select: { name: true },
    });
    const existingNamesLower = new Set(
      existingBands.map((b) => b.name.toLowerCase())
    );

    const newArtistNames = uniqueNames.filter(
      (name) => !existingNamesLower.has(name.toLowerCase())
    );

    return NextResponse.json({
      totalExternalArtists: uniqueNames.length,
      alreadyInDatabase: uniqueNames.length - newArtistNames.length,
      wouldImport: newArtistNames.length,
      totalBandsInDatabase: existingBands.length,
      spotifyConfigured: isSpotifyConfigured(),
      sampleNewArtists: newArtistNames.slice(0, 20),
    });
  } catch (error) {
    console.error("[Import Preview] Error:", error);
    return NextResponse.json(
      { error: "Failed to preview import" },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique slug, appending a counter if collisions exist
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 0;

  while (true) {
    const existing = await prisma.band.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
}
