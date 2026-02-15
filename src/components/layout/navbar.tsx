"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Music, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/bands", label: "Artists" },
    { href: "/events", label: "Shows" },
    { href: "/dream-show", label: "Dream Show" },
    ...(session ? [{ href: "/my-events", label: "My Shows" }] : []),
    ...((session?.user?.role === "ADMIN" || session?.user?.role === "OPERATOR")
      ? [{ href: "/admin", label: session?.user?.role === "ADMIN" ? "Admin" : "Operator" }]
      : []),
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600">
            <Music className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Demand A Band
          </span>
        </Link>

        {/* Desktop Navigation — centered */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-orange-50 text-orange-700"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute inset-x-1 -bottom-[13px] h-0.5 rounded-full bg-orange-600" />
              )}
            </Link>
          ))}
        </nav>

        {/* Auth buttons / User menu */}
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
          ) : session ? (
            <>
              <NotificationBell />
              <UserMenu user={session.user} />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Sign up
                </Button>
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-orange-50 text-orange-700"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {!session && status !== "loading" && (
            <div className="mt-3 flex flex-col gap-2 border-t pt-3">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-center">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full justify-center bg-orange-600 hover:bg-orange-700">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
