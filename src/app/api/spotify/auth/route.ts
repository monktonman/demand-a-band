import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSpotifyConfigured, buildSpotifyAuthUrl } from "@/lib/spotify";

/**
 * GET /api/spotify/auth
 *
 * Generates a Spotify authorization URL and returns it.
 * Stores a CSRF state parameter in a cookie for validation on callback.
 * Requires an authenticated session.
 */
export async function GET() {
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

  return response;
}
