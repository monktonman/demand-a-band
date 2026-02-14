import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Music2, Users, TrendingUp, Sparkles } from "lucide-react";

interface BandListItemProps {
  band: {
    id: string;
    name: string;
    slug: string;
    genres: string[];
    popularity: number | null;
    monthlyListeners: number | null;
    _count: { userPreferences: number; events: number };
  };
  index: number;
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

export function BandListItem({ band, index }: BandListItemProps) {
  const popularity = band.popularity ?? 0;
  const demandCount = band._count.userPreferences;
  const eventCount = band._count.events;

  return (
    <div className="group flex items-center gap-4 rounded-lg border border-zinc-100 bg-white px-4 py-3 transition-all hover:shadow-md hover:border-orange-200">
      {/* Rank */}
      <span className="w-8 shrink-0 text-center text-sm font-medium text-zinc-300">
        {index + 1}
      </span>

      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
        <Music2 className="h-5 w-5 text-orange-600" />
      </div>

      {/* Name & Genres */}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-tight truncate group-hover:text-orange-600 transition-colors">
          {band.name}
        </h3>
        <p className="text-xs text-zinc-400 truncate mt-0.5">
          {band.genres.slice(0, 3).join(" · ")}
        </p>
      </div>

      {/* Monthly Listeners */}
      <div className="hidden sm:block w-24 text-right">
        {band.monthlyListeners ? (
          <div>
            <p className="text-sm font-medium text-zinc-700">
              {formatListeners(band.monthlyListeners)}
            </p>
            <p className="text-xs text-zinc-400">listeners</p>
          </div>
        ) : (
          <span className="text-xs text-zinc-300">—</span>
        )}
      </div>

      {/* Popularity */}
      <div className="hidden md:flex items-center gap-2 w-32">
        <div className="flex-1">
          <div className="flex items-center gap-1 text-xs text-zinc-400 mb-1">
            <TrendingUp className="h-3 w-3" />
            <span>{popularity}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${getPopularityBar(popularity)}`}
              style={{ width: `${popularity}%` }}
            />
          </div>
        </div>
      </div>

      {/* Demand */}
      <div className="hidden lg:flex items-center gap-1 w-20 text-sm">
        <Users className="h-3.5 w-3.5 text-zinc-400" />
        <span className={demandCount > 0 ? "font-medium text-zinc-700" : "text-zinc-300"}>
          {demandCount}
        </span>
      </div>

      {/* Dream Show button */}
      <div className="w-28 text-right">
        <Link
          href={`/dream-show?band=${band.id}&bandName=${encodeURIComponent(band.name)}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-white px-2.5 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-700">
            <Sparkles className="h-3 w-3" />
            Dream Show
          </button>
        </Link>
      </div>
    </div>
  );
}
