import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
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
        const publicPaths = ["/", "/login", "/register", "/api/auth", "/events", "/api/events", "/api/bands", "/bands", "/dream-show"];
        if (publicPaths.some((p) => pathname.startsWith(p))) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Match all routes except static files, _next, and public assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
