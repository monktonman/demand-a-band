"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Music, Sparkles, ArrowRight } from "lucide-react";

interface StepCompleteProps {
  bandCount: number;
  dreamShowCount: number;
  onFinish: () => void;
}

export function StepComplete({
  bandCount,
  dreamShowCount,
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
      <div className="mx-auto flex max-w-sm justify-center gap-6">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-50 p-4">
          <Music className="h-6 w-6 text-orange-600" />
          <span className="text-2xl font-bold text-zinc-900">{bandCount}</span>
          <span className="text-sm text-zinc-500">Bands selected</span>
        </div>

        {dreamShowCount > 0 && (
          <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-50 p-4">
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
          Browse upcoming events and pledge your support to make shows happen.
        </p>

        <Button
          onClick={onFinish}
          size="lg"
          className="bg-orange-600 text-base hover:bg-orange-700"
        >
          Browse Events
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
