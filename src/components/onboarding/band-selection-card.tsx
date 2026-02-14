"use client";

import { Badge } from "@/components/ui/badge";
import { Check, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BandSelectionCardProps {
  band: {
    id: string;
    name: string;
    genres: string[];
    imageUrl?: string | null;
    popularity?: number;
  };
  isSelected: boolean;
  onToggle: () => void;
  spotifyImported?: boolean;
}

export function BandSelectionCard({
  band,
  isSelected,
  onToggle,
  spotifyImported,
}: BandSelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative flex w-full flex-col items-start rounded-xl border p-3 text-left transition-all",
        "hover:shadow-md hover:border-orange-200",
        isSelected
          ? "border-orange-400 bg-orange-50 shadow-sm ring-1 ring-orange-200"
          : "border-zinc-200 bg-white"
      )}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Spotify badge */}
      {spotifyImported && (
        <div className="absolute left-2 top-2">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
        </div>
      )}

      {/* Band icon */}
      <div className={cn(
        "mb-2 flex h-10 w-10 items-center justify-center rounded-lg",
        isSelected ? "bg-orange-200" : "bg-zinc-100"
      )}>
        <Music2 className={cn(
          "h-5 w-5",
          isSelected ? "text-orange-700" : "text-zinc-400"
        )} />
      </div>

      {/* Band name */}
      <p className={cn(
        "text-sm font-semibold leading-tight line-clamp-1",
        isSelected ? "text-orange-900" : "text-zinc-900"
      )}>
        {band.name}
      </p>

      {/* Genres */}
      <div className="mt-1.5 flex flex-wrap gap-1">
        {band.genres.slice(0, 2).map((genre) => (
          <Badge
            key={genre}
            variant="outline"
            className={cn(
              "px-1.5 py-0 text-[10px] font-normal",
              isSelected
                ? "border-orange-300 text-orange-700"
                : "border-zinc-200 text-zinc-500"
            )}
          >
            {genre}
          </Badge>
        ))}
      </div>

      {/* Popularity bar */}
      {band.popularity != null && (
        <div className="mt-2 h-1 w-full rounded-full bg-zinc-100">
          <div
            className={cn(
              "h-1 rounded-full transition-all",
              isSelected ? "bg-orange-400" : "bg-zinc-300"
            )}
            style={{ width: `${Math.min(band.popularity, 100)}%` }}
          />
        </div>
      )}
    </button>
  );
}
