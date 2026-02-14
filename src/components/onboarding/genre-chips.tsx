"use client";

import { cn } from "@/lib/utils";

interface GenreChipsProps {
  genres: readonly string[];
  activeGenre: string | null;
  onSelect: (genre: string | null) => void;
}

export function GenreChips({ genres, activeGenre, onSelect }: GenreChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* All chip */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          activeGenre === null
            ? "bg-orange-600 text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        )}
      >
        All
      </button>

      {/* Genre chips */}
      {genres.map((genre) => (
        <button
          key={genre}
          type="button"
          onClick={() => onSelect(genre === activeGenre ? null : genre)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
            genre === activeGenre
              ? "bg-orange-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
