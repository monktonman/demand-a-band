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

      {/* Saved preferences checklist */}
      <div className="mx-auto max-w-sm space-y-3">
        {genreCount > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-purple-50 px-4 py-3">
            <CheckCircle className="h-5 w-5 text-purple-600 shrink-0" />
            <span className="text-sm font-medium text-zinc-800">
              {genreCount} genre{genreCount !== 1 ? "s" : ""} selected
            </span>
          </div>
        )}
        {bandCount > 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-orange-50 px-4 py-3">
            <CheckCircle className="h-5 w-5 text-orange-600 shrink-0" />
            <span className="text-sm font-medium text-zinc-800">
              {bandCount} artist{bandCount !== 1 ? "s" : ""} following
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-zinc-50 px-4 py-3">
            <Music className="h-5 w-5 text-zinc-400 shrink-0" />
            <span className="text-sm text-zinc-500">
              No artists yet &mdash; you can add them later from My Shows
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
          <span className="text-sm font-medium text-zinc-800">
            {cityCount} {cityCount === 1 ? "city" : "cities"} added
          </span>
        </div>
        {dreamShowCount > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3">
            <CheckCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="text-sm font-medium text-zinc-800">
              {dreamShowCount} dream show{dreamShowCount !== 1 ? "s" : ""} created
            </span>
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
