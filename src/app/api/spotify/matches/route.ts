import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/spotify/matches
 *
 * Retrieves the matched bands from the Spotify import.
 * Reads band IDs from the spotify_matched_bands cookie (set by callback),
 * returns full band objects, and clears the cookie.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matchedCookie = req.cookies.get("spotify_matched_bands")?.value;

  if (!matchedCookie) {
    return NextResponse.json({ bands: [], unmatchedCount: 0 });
  }

  try {
    const bandIds: string[] = JSON.parse(matchedCookie);

    if (!Array.isArray(bandIds) || bandIds.length === 0) {
      return NextResponse.json({ bands: [], unmatchedCount: 0 });
    }

    // Fetch full band objects
    const bands = await prisma.band.findMany({
      where: {
        id: { in: bandIds },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        genres: true,
        imageUrl: true,
        popularity: true,
      },
      orderBy: {
        popularity: "desc",
      },
    });

    // Clear the cookie (one-time use)
    const response = NextResponse.json({
      bands,
      unmatchedCount: 0,
    });

    response.cookies.delete("spotify_matched_bands");

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to parse match data" },
      { status: 400 }
    );
  }
}
