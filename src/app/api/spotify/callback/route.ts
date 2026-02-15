import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForTokens,
  fetchTopArtists,
  getSpotifyUserId,
  matchArtistsToCatalog,
} from "@/lib/spotify";

/**
 * GET /api/spotify/callback
 *
 * Handles the Spotify OAuth redirect. Exchanges the auth code for tokens,
 * fetches the user's top artists, matches them against the band catalog,
 * and stores the matched band IDs in a cookie for the onboarding page.
 */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Determine return path from cookie (default /onboarding)
    const returnTo = req.cookies.get("spotify_return_to")?.value || "/onboarding";

    // User denied access
    if (error) {
      return NextResponse.redirect(
        `${baseUrl}${returnTo}?spotify=denied`
      );
    }

    // Validate state (CSRF)
    const storedState = req.cookies.get("spotify_oauth_state")?.value;
    const userId = req.cookies.get("spotify_oauth_user")?.value;

    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(
        `${baseUrl}${returnTo}?spotify=error&reason=invalid_state`
      );
    }

    if (!code || !userId) {
      return NextResponse.redirect(
        `${baseUrl}${returnTo}?spotify=error&reason=missing_params`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get Spotify user ID for Account model
    const spotifyUserId = await getSpotifyUserId(tokens.access_token);

    // Store tokens in Account model
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "spotify",
          providerAccountId: spotifyUserId,
        },
      },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
      create: {
        userId,
        type: "oauth",
        provider: "spotify",
        providerAccountId: spotifyUserId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
    });

    // Fetch top artists
    const topArtists = await fetchTopArtists(tokens.access_token);
    console.log(`[Spotify] Fetched ${topArtists.length} top artists for user ${spotifyUserId}`);

    // Match against band catalog
    const { matched, unmatchedCount } =
      await matchArtistsToCatalog(topArtists);
    console.log(`[Spotify] Matched ${matched.length} bands, ${unmatchedCount} unmatched. Matched: ${matched.map(b => b.name).join(', ') || 'none'}`);

    // Store matched band IDs in a cookie for the return page
    const matchedIds = matched.map((b) => b.id);
    const response = NextResponse.redirect(
      `${baseUrl}${returnTo}?spotify=success&matched=${matched.length}&unmatched=${unmatchedCount}`
    );

    // Store matched IDs (cookie has a 4KB limit, so we use JSON)
    response.cookies.set("spotify_matched_bands", JSON.stringify(matchedIds), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1800, // 30 minutes
      path: "/",
    });

    // Clear state cookies
    response.cookies.delete("spotify_oauth_state");
    response.cookies.delete("spotify_oauth_user");
    response.cookies.delete("spotify_return_to");

    return response;
  } catch (err) {
    console.error("Spotify callback error:", err);
    // Best-effort returnTo from cookie, fallback to /onboarding
    const fallbackReturn = req.cookies.get("spotify_return_to")?.value || "/onboarding";
    return NextResponse.redirect(
      `${baseUrl}${fallbackReturn}?spotify=error&reason=server_error`
    );
  }
}
