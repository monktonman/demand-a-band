import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

// Beta gate paths that should bypass the gate
const betaBypassPaths = ["/beta", "/api/beta", "/_next", "/favicon.ico"];

function isBetaBypass(pathname: string): boolean {
  return betaBypassPaths.some((p) => pathname.startsWith(p));
}

// Check beta gate before anything else
function checkBetaGate(req: NextRequest): NextResponse | null {
  const betaCode = process.env.BETA_ACCESS_CODE;

  // If no beta code configured, gate is disabled — let everyone through
  if (!betaCode) return null;

  const { pathname } = req.nextUrl;

  // Always allow beta page and its API
  if (isBetaBypass(pathname)) return null;

  // Check for beta cookie
  const betaCookie = req.cookies.get("beta_access");
  if (betaCookie?.value === "granted") return null;

  // Redirect to beta gate
  return NextResponse.redirect(new URL("/beta", req.url));
}

const authMiddleware = withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes require ADMIN role
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // If user is not onboarded, redirect to onboarding
    // (except if they're already on the onboarding page or API routes)
    if (
      token &&
      !token.onboarded &&
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/events") &&
      !pathname.startsWith("/bands") &&
      !pathname.startsWith("/dream-show") &&
      pathname !== "/"
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require auth
        const publicPaths = ["/", "/login", "/register", "/api/auth", "/events", "/api/events", "/api/bands", "/bands", "/dream-show", "/api/dream-shows", "/beta", "/api/beta"];
        if (publicPaths.some((p) => pathname.startsWith(p))) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export default function middleware(req: NextRequest) {
  // Check beta gate first
  const betaResponse = checkBetaGate(req);
  if (betaResponse) return betaResponse;

  // Then run auth middleware
  return (authMiddleware as unknown as (req: NextRequest) => NextResponse)(req);
}

export const config = {
  matcher: [
    // Match all routes except static files, _next, and public assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
