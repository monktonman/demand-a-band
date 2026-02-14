"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600">
            <Music className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Demand A Band
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/events"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Events
          </Link>
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Auth buttons / User menu */}
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
          ) : session ? (
            <UserMenu user={session.user} />
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
