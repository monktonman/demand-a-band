"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GENRES } from "@/lib/constants";

interface GenrePreferenceSelectorProps {
  selectedGenres: string[];
  onToggle: (genre: string) => void;
}

export function GenrePreferenceSelector({
  selectedGenres,
  onToggle,
}: GenrePreferenceSelectorProps) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-zinc-700">
          What genres do you enjoy?{" "}
          <span className="font-normal text-zinc-400">(optional)</span>
        </h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          This helps us find shows you&apos;ll love, even from artists you haven&apos;t discovered yet.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {GENRES.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onToggle(genre)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                isSelected
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
              {genre}
            </button>
          );
        })}
      </div>
      {selectedGenres.length > 0 && (
        <p className="mt-2 text-xs text-zinc-400">
          {selectedGenres.length} genre{selectedGenres.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
