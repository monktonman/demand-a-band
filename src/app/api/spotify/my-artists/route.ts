import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTopArtists } from "@/lib/spotify";

/**
 * GET /api/spotify/my-artists
 *
 * Returns the current user's Spotify top artists that exist in the band catalog.
 * Uses the stored Spotify access token from the Account model.
 * Falls back to returning all bands with a spotifyId if the token is expired.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Look up the user's Spotify account
    const spotifyAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "spotify",
      },
      select: {
        access_token: true,
        expires_at: true,
        refresh_token: true,
      },
    });

    if (!spotifyAccount?.access_token) {
      // No Spotify account linked — return empty
      return NextResponse.json({ bands: [], connected: false });
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const isExpired = spotifyAccount.expires_at
      ? spotifyAccount.expires_at < now
      : false;

    if (isExpired) {
      // Token expired — try to refresh
      if (spotifyAccount.refresh_token) {
        try {
          const refreshRes = await fetch(
            "https://accounts.spotify.com/api/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(
                  `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                ).toString("base64")}`,
              },
              body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: spotifyAccount.refresh_token,
              }),
            }
          );

          if (refreshRes.ok) {
            const tokens = await refreshRes.json();

            // Update the stored token
            await prisma.account.updateMany({
              where: {
                userId: session.user.id,
                provider: "spotify",
              },
              data: {
                access_token: tokens.access_token,
                expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
                ...(tokens.refresh_token
                  ? { refresh_token: tokens.refresh_token }
                  : {}),
              },
            });

            spotifyAccount.access_token = tokens.access_token;
          } else {
            // Refresh failed — return what we have in the catalog
            return await fallbackCatalogBands(session.user.id);
          }
        } catch {
          return await fallbackCatalogBands(session.user.id);
        }
      } else {
        return await fallbackCatalogBands(session.user.id);
      }
    }

    // Fetch top artists from Spotify
    const topArtists = await fetchTopArtists(spotifyAccount.access_token!);

    if (topArtists.length === 0) {
      return NextResponse.json({ bands: [], connected: true });
    }

    // Find matching bands in our catalog by spotifyId
    const spotifyIds = topArtists.map((a) => a.spotifyId);
    const bands = await prisma.band.findMany({
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
      },
      orderBy: {
        popularity: "desc",
      },
    });

    return NextResponse.json({ bands, connected: true });
  } catch (error) {
    console.error("[Spotify] Failed to fetch my artists:", error);
    return await fallbackCatalogBands(session.user.id);
  }
}

/**
 * Fallback: return bands from user's preferences that have a spotifyId
 */
async function fallbackCatalogBands(userId: string) {
  const prefs = await prisma.userBandPreference.findMany({
    where: { userId },
    include: {
      band: {
        select: {
          id: true,
          name: true,
          slug: true,
          genres: true,
          imageUrl: true,
          popularity: true,
          spotifyId: true,
        },
      },
    },
  });

  const bands = prefs
    .filter((p) => p.band.spotifyId)
    .map((p) => ({
      id: p.band.id,
      name: p.band.name,
      slug: p.band.slug,
      genres: p.band.genres,
      imageUrl: p.band.imageUrl,
      popularity: p.band.popularity,
    }));

  return NextResponse.json({ bands, connected: true, tokenExpired: true });
}
