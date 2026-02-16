"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music2, Users, TrendingUp, Sparkles, Heart, Check } from "lucide-react";

interface BandCardProps {
  band: {
    id: string;
    name: string;
    slug: string;
    genres: string[];
    popularity: number | null;
    monthlyListeners: number | null;
    _count: { userPreferences: number; events: number };
  };
}

function formatListeners(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

function getPopularityColor(pop: number): string {
  if (pop >= 80) return "bg-orange-600 text-white";
  if (pop >= 60) return "bg-orange-100 text-orange-800";
  if (pop >= 40) return "bg-zinc-100 text-zinc-700";
  return "bg-zinc-50 text-zinc-500";
}

function getPopularityBar(pop: number): string {
  if (pop >= 80) return "bg-orange-500";
  if (pop >= 60) return "bg-orange-400";
  if (pop >= 40) return "bg-orange-300";
  return "bg-zinc-300";
}

export function BandCard({ band }: BandCardProps) {
  const { data: session } = useSession();
  const popularity = band.popularity ?? 0;
  const demandCount = band._count.userPreferences;
  const eventCount = band._count.events;
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  const addToPreferences = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/preferences/bands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bandId: band.id }),
      });
      if (res.ok) {
        setAdded(true);
      }
    } catch {
      // silently fail
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="group h-full transition-all hover:shadow-lg hover:border-orange-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
              <Music2 className="h-5 w-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold leading-tight truncate group-hover:text-orange-600 transition-colors">
                {band.name}
              </h3>
              {band.monthlyListeners && (
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatListeners(band.monthlyListeners)} listeners
                </p>
              )}
            </div>
          </div>
          <Badge className={`shrink-0 text-xs ${getPopularityColor(popularity)}`}>
            {popularity}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Genres */}
        <div className="flex flex-wrap gap-1">
          {band.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Popularity bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Popularity
            </span>
            <span>{popularity}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getPopularityBar(popularity)}`}
              style={{ width: `${popularity}%` }}
            />
          </div>
        </div>

        {/* Demand & Events */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-50">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {demandCount} {demandCount === 1 ? "fan" : "fans"} want this
          </span>
          {eventCount > 0 && (
            <span className="text-orange-600 font-medium">
              {eventCount} {eventCount === 1 ? "show" : "shows"}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        <button
          onClick={addToPreferences}
          disabled={added || adding}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            added
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-zinc-200 text-zinc-600 hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200"
          }`}
        >
          {added ? (
            <><Check className="h-3.5 w-3.5" />Added</>
          ) : (
            <><Heart className="h-3.5 w-3.5" />{adding ? "Adding..." : "I Want This"}</>
          )}
        </button>
        <Link
          href={`/dream-show?band=${band.id}&bandName=${encodeURIComponent(band.name)}`}
          className="flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Dream Show
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
