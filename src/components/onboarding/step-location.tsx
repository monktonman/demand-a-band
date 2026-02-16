"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Loader2, MapPin, Plus, X } from "lucide-react";
import { OnboardingTour } from "@/components/shared/onboarding-tour";
import type { CityPreference } from "@/app/(main)/onboarding/page";

interface StepLocationProps {
  cityPreferences: CityPreference[];
  setCityPreferences: React.Dispatch<React.SetStateAction<CityPreference[]>>;
  onNext: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const SUGGESTED_CITIES = [
  { city: "Baltimore", state: "MD" },
  { city: "Washington", state: "DC" },
  { city: "Annapolis", state: "MD" },
  { city: "Philadelphia", state: "PA" },
  { city: "Richmond", state: "VA" },
];

export function StepLocation({
  cityPreferences,
  setCityPreferences,
  onNext,
  onBack,
  isSubmitting,
}: StepLocationProps) {
  const addCity = (city: string, state: string) => {
    // Don't add duplicates
    if (cityPreferences.some((p) => p.city === city && p.state === state)) {
      return;
    }
    setCityPreferences((prev) => [...prev, { city, state, maxRadius: 50 }]);
  };

  const removeCity = (index: number) => {
    setCityPreferences((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRadius = (index: number, radius: number) => {
    setCityPreferences((prev) =>
      prev.map((p, i) => (i === index ? { ...p, maxRadius: radius } : p))
    );
  };

  const availableSuggestions = SUGGESTED_CITIES.filter(
    (s) =>
      !cityPreferences.some((p) => p.city === s.city && p.state === s.state)
  );

  return (
    <div className="space-y-6">
      {/* Guided tour for first-time users */}
      <OnboardingTour step="location" />

      {/* Location concept explainer */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 p-4">
        <p className="text-sm text-zinc-700 leading-relaxed">
          <span className="font-semibold text-blue-700">Almost done!</span>{" "}
          Tell us where you want to see shows. We&apos;ll use your location to find nearby events and notify you when artists you love are performing in your area.
        </p>
      </div>

      {/* Current cities */}
      <div data-tour="onboarding-cities" className="space-y-3">
        {cityPreferences.map((pref, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                <span className="font-medium">
                  {pref.city}, {pref.state}
                </span>
              </div>
              {cityPreferences.length > 1 && (
                <button
                  onClick={() => removeCity(index)}
                  className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div data-tour="onboarding-radius" className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <Label>Travel radius</Label>
                <span className="font-medium text-orange-600">
                  {pref.maxRadius} miles
                </span>
              </div>
              <Slider
                value={[pref.maxRadius]}
                onValueChange={([value]) => updateRadius(index, value)}
                min={10}
                max={200}
                step={5}
                className="mt-2"
              />
              <div className="mt-1 flex justify-between text-xs text-zinc-400">
                <span>10 mi</span>
                <span>200 mi</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Suggested cities */}
      {availableSuggestions.length > 0 && (
        <div data-tour="onboarding-suggested-cities">
          <h3 className="mb-2 text-sm font-medium text-zinc-700">
            Suggested cities
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((suggestion) => (
              <Button
                key={`${suggestion.city}-${suggestion.state}`}
                variant="outline"
                size="sm"
                onClick={() => addCity(suggestion.city, suggestion.state)}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                {suggestion.city}, {suggestion.state}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom city input */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-700">
          Add another city
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const city = formData.get("city") as string;
            const state = formData.get("state") as string;
            if (city && state) {
              addCity(city, state.toUpperCase());
              e.currentTarget.reset();
            }
          }}
          className="flex gap-2"
        >
          <Input name="city" placeholder="City name" className="flex-1" />
          <Input
            name="state"
            placeholder="ST"
            maxLength={2}
            className="w-16"
          />
          <Button type="submit" variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={cityPreferences.length === 0 || isSubmitting}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
