import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { normalizeGenres } from "@/lib/genre-normalization";

/**
 * GET /api/admin/backfill-genres
 *
 * Preview: how many bands need canonicalGenres backfilled.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const needsBackfill = await prisma.band.count({
    where: {
      canonicalGenres: { isEmpty: true },
      genres: { isEmpty: false },
    },
  });

  const alreadyNormalized = await prisma.band.count({
    where: {
      canonicalGenres: { isEmpty: false },
    },
  });

  const noGenres = await prisma.band.count({
    where: {
      genres: { isEmpty: true },
    },
  });

  return NextResponse.json({
    needsBackfill,
    alreadyNormalized,
    noGenres,
    total: needsBackfill + alreadyNormalized + noGenres,
  });
}

/**
 * POST /api/admin/backfill-genres
 *
 * Backfill canonicalGenres for all bands that have genres but no canonicalGenres.
 * Runs normalizeGenres() on each, which uses AI when available, deterministic fallback otherwise.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bands = await prisma.band.findMany({
      where: {
        canonicalGenres: { isEmpty: true },
        genres: { isEmpty: false },
      },
      select: { id: true, name: true, genres: true },
    });

    if (bands.length === 0) {
      return NextResponse.json({
        message: "All bands already have canonicalGenres populated",
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
    }

    let succeeded = 0;
    let failed = 0;
    const results: { name: string; genres: string[]; canonicalGenres: string[] }[] = [];

    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      try {
        const canonicalGenres = await normalizeGenres(band.genres);

        await prisma.band.update({
          where: { id: band.id },
          data: { canonicalGenres },
        });

        succeeded++;
        results.push({
          name: band.name,
          genres: band.genres,
          canonicalGenres,
        });
      } catch (err) {
        console.error(`[Backfill] Failed for "${band.name}":`, err);
        failed++;
      }

      // Rate limit: avoid hammering the AI API
      if (i > 0 && i % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Log progress every 50 bands
      if ((i + 1) % 50 === 0) {
        console.log(
          `[Backfill] Progress: ${i + 1}/${bands.length} (succeeded: ${succeeded}, failed: ${failed})`
        );
      }
    }

    console.log(
      `[Backfill] Complete: ${succeeded} succeeded, ${failed} failed out of ${bands.length}`
    );

    return NextResponse.json({
      message: `Backfilled ${succeeded} bands with canonicalGenres`,
      processed: bands.length,
      succeeded,
      failed,
      results: results.slice(0, 50), // Show first 50 for review
    });
  } catch (error) {
    console.error("[Backfill] Error:", error);
    return NextResponse.json(
      { error: "Failed to backfill genres" },
      { status: 500 }
    );
  }
}
