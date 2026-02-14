import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSpotifyConfigured, buildSpotifyAuthUrl } from "@/lib/spotify";

/**
 * GET /api/spotify/auth?returnTo=/preferences
 *
 * Generates a Spotify authorization URL and returns it.
 * Stores a CSRF state parameter in a cookie for validation on callback.
 * Requires an authenticated session.
 * Optional returnTo query param controls where user lands after callback.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSpotifyConfigured()) {
    return NextResponse.json(
      { error: "Spotify is not configured" },
      { status: 500 }
    );
  }

  // Parse returnTo from query string (default to /onboarding)
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/onboarding";

  // Generate random state for CSRF protection
  const state = crypto.randomUUID();

  // Build the Spotify auth URL
  const url = buildSpotifyAuthUrl(state);

  // Create response with state cookie
  const response = NextResponse.json({ url });
  response.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  // Also store user ID for the callback
  response.cookies.set("spotify_oauth_user", session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  // Store returnTo so callback knows where to redirect
  response.cookies.set("spotify_return_to", returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
