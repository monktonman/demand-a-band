"use client";

import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GENRES } from "@/lib/constants";
import { OnboardingTour } from "@/components/shared/onboarding-tour";

interface StepGenresProps {
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  onNext: () => void;
}

const MIN_GENRES = 1;

export function StepGenres({
  selectedGenres,
  onToggleGenre,
  onNext,
}: StepGenresProps) {
  const canContinue = selectedGenres.length >= MIN_GENRES;

  return (
    <div className="space-y-6">
      {/* Guided tour */}
      <OnboardingTour step="genres" />

      {/* Concept explainer */}
      <div
        data-tour="onboarding-concept"
        className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4"
      >
        <p className="text-sm text-zinc-700 leading-relaxed">
          <span className="font-semibold text-orange-700">How it works:</span>{" "}
          Fans like you vote for the music they want to see live. When enough
          people demand the same artist, we book the show! Start by telling us
          what kind of music you love.
        </p>
      </div>

      {/* Genre heading */}
      <div data-tour="onboarding-genres" className="text-center">
        <h3 className="text-base font-semibold text-zinc-800">
          What genres are you into?
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Pick at least {MIN_GENRES} — the more you choose, the better we can
          match you with shows.
        </p>
      </div>

      {/* Genre grid */}
      <div className="flex flex-wrap justify-center gap-2.5">
        {GENRES.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onToggleGenre(genre)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
                isSelected
                  ? "bg-orange-600 text-white shadow-md scale-105"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:shadow-sm"
              )}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
              {genre}
            </button>
          );
        })}
      </div>

      {/* Selection count */}
      <div className="text-center">
        {selectedGenres.length > 0 ? (
          <p className="text-sm text-orange-600 font-medium">
            <Sparkles className="inline h-3.5 w-3.5 mr-1" />
            {selectedGenres.length} genre{selectedGenres.length !== 1 ? "s" : ""}{" "}
            selected
          </p>
        ) : (
          <p className="text-sm text-zinc-400">
            Tap the genres you enjoy to get started
          </p>
        )}
      </div>

      {/* Next button */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
        <p className="text-sm text-zinc-400">
          {canContinue
            ? "Looking good! Continue to pick specific artists."
            : `Select at least ${MIN_GENRES} genre to continue`}
        </p>
        <Button
          onClick={onNext}
          disabled={!canContinue}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Continue
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
