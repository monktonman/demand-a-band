"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Music, Sparkles, ArrowRight, Sliders, MapPin } from "lucide-react";

interface StepCompleteProps {
  bandCount: number;
  genreCount: number;
  cityCount: number;
  dreamShowCount?: number;
  onFinish: () => void;
}

export function StepComplete({
  bandCount,
  genreCount,
  cityCount,
  dreamShowCount = 0,
  onFinish,
}: StepCompleteProps) {
  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-zinc-900">
          You&apos;re all set!
        </h2>
        <p className="mt-2 text-zinc-500">
          Your preferences have been saved. We&apos;ll use them to surface the
          shows you care about most.
        </p>
      </div>

      {/* Stats */}
      <div className="mx-auto flex max-w-md flex-wrap justify-center gap-4">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-orange-50 px-5 py-4">
          <Music className="h-6 w-6 text-orange-600" />
          <span className="text-2xl font-bold text-zinc-900">{bandCount}</span>
          <span className="text-sm text-zinc-500">Artists</span>
        </div>

        {genreCount > 0 && (
          <div className="flex flex-col items-center gap-1 rounded-lg bg-purple-50 px-5 py-4">
            <Sliders className="h-6 w-6 text-purple-600" />
            <span className="text-2xl font-bold text-zinc-900">{genreCount}</span>
            <span className="text-sm text-zinc-500">Genres</span>
          </div>
        )}

        <div className="flex flex-col items-center gap-1 rounded-lg bg-blue-50 px-5 py-4">
          <MapPin className="h-6 w-6 text-blue-600" />
          <span className="text-2xl font-bold text-zinc-900">{cityCount}</span>
          <span className="text-sm text-zinc-500">{cityCount === 1 ? "City" : "Cities"}</span>
        </div>

        {dreamShowCount > 0 && (
          <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-50 px-5 py-4">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <span className="text-2xl font-bold text-amber-700">
              {dreamShowCount}
            </span>
            <span className="text-sm text-amber-600">Dream shows</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm text-zinc-400">
          Head to My Shows to see your personalized hub, or browse upcoming events.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={onFinish}
            size="lg"
            className="bg-orange-600 text-base hover:bg-orange-700"
          >
            Go to My Shows
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
