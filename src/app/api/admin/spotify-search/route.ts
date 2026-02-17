import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";
import { searchSpotifyArtist, isSpotifyConfigured } from "@/lib/spotify";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// GET: Search Spotify for an artist and check if they're already in the catalog
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "q parameter must be at least 2 characters" },
      { status: 400 }
    );
  }

  if (!isSpotifyConfigured()) {
    return NextResponse.json(
      { error: "Spotify is not configured" },
      { status: 400 }
    );
  }

  try {
    const spotifyResult = await searchSpotifyArtist(query);

    if (!spotifyResult) {
      return NextResponse.json({
        spotifyResult: null,
        existsInCatalog: false,
      });
    }

    // Check if this artist already exists in our catalog
    const existingBand = await prisma.band.findFirst({
      where: {
        OR: [
          { spotifyId: spotifyResult.spotifyId },
          { name: { equals: spotifyResult.name, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      spotifyResult,
      existsInCatalog: !!existingBand,
      catalogBandId: existingBand?.id || null,
      catalogBandName: existingBand?.name || null,
    });
  } catch (error) {
    console.error("[Spotify Search] Error:", error);
    return NextResponse.json(
      { error: "Failed to search Spotify" },
      { status: 500 }
    );
  }
}

// POST: Import a Spotify artist into the catalog
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { spotifyId, name, genres, imageUrl, popularity, spotifyUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Check for duplicates
    const existing = await prisma.band.findFirst({
      where: {
        OR: [
          ...(spotifyId ? [{ spotifyId }] : []),
          { name: { equals: name, mode: "insensitive" as const } },
        ],
      },
      select: { id: true, name: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Artist already exists in catalog",
          existingBandId: existing.id,
          existingBandName: existing.name,
        },
        { status: 409 }
      );
    }

    // Generate unique slug
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const slugExists = await prisma.band.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!slugExists) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // Create the band
    const band = await prisma.band.create({
      data: {
        name,
        slug,
        genres: genres || [],
        imageUrl: imageUrl || null,
        spotifyId: spotifyId || null,
        spotifyUrl: spotifyUrl || null,
        popularity: popularity ?? null,
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

    return NextResponse.json({ band, created: true });
  } catch (error) {
    console.error("[Spotify Import] Error:", error);
    return NextResponse.json(
      { error: "Failed to import artist" },
      { status: 500 }
    );
  }
}
