import Link from "next/link";
import { Music } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-600">
              <Music className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">Demand A Band</span>
          </div>

          <nav className="flex gap-6">
            <Link
              href="/events"
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Events
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              How It Works
            </Link>
          </nav>

          <p className="text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} Demand A Band. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
