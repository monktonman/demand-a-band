import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

// Beta gate paths that should bypass the gate
const betaBypassPaths = ["/beta", "/api/beta", "/_next", "/favicon.ico", "/api/spotify", "/api/external-events", "/api/feedback"];

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

    // If token was invalidated (user deleted), redirect to login
    if (token?.invalidated) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      // Clear the session cookie so they get a fresh login
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }

    // Admin routes require ADMIN or OPERATOR role
    if (pathname.startsWith("/admin")) {
      const role = token?.role as string;
      const isStaff = role === "ADMIN" || role === "OPERATOR";
      if (!isStaff) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      // OPERATOR can only access dashboard, events, venues (read-only), and check-in
      if (role === "OPERATOR") {
        const allowed = pathname === "/admin" ||
          pathname.startsWith("/admin/events") ||
          pathname.startsWith("/admin/venues") ||
          pathname.startsWith("/check-in");
        if (!allowed) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }
    }

    // If user's email is not verified, redirect to verify-email page
    // Admin/Operator accounts are exempt (pre-existing trusted accounts)
    const isStaffRole = token?.role === "ADMIN" || token?.role === "OPERATOR";
    if (
      token &&
      !token.emailVerified &&
      !isStaffRole &&
      !pathname.startsWith("/verify-email") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/register")
    ) {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }

    // If user is not onboarded, redirect to onboarding
    // (except if they're already on the onboarding page, API routes, or auth pages)
    if (
      token &&
      !token.onboarded &&
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/register") &&
      !pathname.startsWith("/verify-email")
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
        const publicPaths = ["/", "/login", "/register", "/verify-email", "/api/auth", "/events", "/api/events", "/api/bands", "/bands", "/dream-show", "/api/dream-shows", "/beta", "/api/beta", "/api/spotify", "/api/external-events", "/api/feedback", "/check-in/verify"];
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
