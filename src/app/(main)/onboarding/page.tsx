"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Music, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepBands } from "@/components/onboarding/step-bands";
import { StepLocation } from "@/components/onboarding/step-location";
import { StepPricing } from "@/components/onboarding/step-pricing";
import { StepComplete } from "@/components/onboarding/step-complete";

export interface SelectedBand {
  id: string;
  name: string;
  genres: string[];
  imageUrl?: string | null;
  maxTicketPrice: number;
  isDreamShow: boolean;
  source?: "manual" | "spotify";
}

export interface CityPreference {
  city: string;
  state: string;
  maxRadius: number;
}

const STEPS = [
  { title: "Pick Your Bands", description: "Who do you want to see live?" },
  {
    title: "Your Location",
    description: "Where do you want to see shows?",
  },
  {
    title: "Set Your Prices",
    description: "What would you pay per ticket?",
  },
  {
    title: "You're All Set!",
    description: "Welcome to Demand A Band",
  },
];

function OnboardingContent() {
  const { update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBands, setSelectedBands] = useState<SelectedBand[]>([]);
  const [cityPreferences, setCityPreferences] = useState<CityPreference[]>([
    { city: "Baltimore", state: "MD", maxRadius: 50 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [spotifyImported, setSpotifyImported] = useState(false);
  const [spotifyMessage, setSpotifyMessage] = useState("");

  // Handle Spotify return
  useEffect(() => {
    const spotifyStatus = searchParams.get("spotify");
    if (!spotifyStatus) return;

    if (spotifyStatus === "success") {
      // Fetch matched bands from cookie
      const matchedCount = searchParams.get("matched") || "0";

      fetch("/api/spotify/matches")
        .then((res) => res.json())
        .then((data) => {
          if (data.bands && data.bands.length > 0) {
            setSelectedBands((prev) => {
              const existingIds = new Set(prev.map((b) => b.id));
              const newBands: SelectedBand[] = data.bands
                .filter((b: { id: string }) => !existingIds.has(b.id))
                .map((b: { id: string; name: string; genres: string[]; imageUrl: string | null }) => ({
                  id: b.id,
                  name: b.name,
                  genres: b.genres,
                  imageUrl: b.imageUrl,
                  maxTicketPrice: 50,
                  isDreamShow: false,
                  source: "spotify" as const,
                }));
              return [...prev, ...newBands];
            });
            setSpotifyImported(true);
            setSpotifyMessage(
              `Imported ${matchedCount} bands from your Spotify listening history!`
            );
          }
        })
        .catch((err) => {
          console.error("Failed to fetch Spotify matches:", err);
        });
    } else if (spotifyStatus === "denied") {
      setSpotifyMessage("Spotify access was denied. You can still pick bands manually.");
    } else if (spotifyStatus === "error") {
      setSpotifyMessage("Something went wrong with Spotify. You can still pick bands manually.");
    }

    // Clean URL params
    router.replace("/onboarding", { scroll: false });
  }, [searchParams, router]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSpotifyConnect = async () => {
    try {
      const res = await fetch("/api/spotify/auth");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to connect to Spotify");
      }
    } catch {
      setError("Failed to connect to Spotify");
    }
  };

  const handleSavePreferences = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bandPreferences: selectedBands.map((band, i) => ({
            bandId: band.id,
            maxTicketPrice: band.maxTicketPrice,
            priority: i + 1,
            isDreamShow: band.isDreamShow,
          })),
          cityPreferences,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      // Update session to mark as onboarded
      await updateSession({ onboarded: true });

      // Move to completion step
      handleNext();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    router.push("/events");
    router.refresh();
  };

  return (
    <div className={cn(
      "mx-auto px-4 py-8 sm:py-12",
      currentStep === 0 ? "max-w-4xl" : "max-w-2xl"
    )}>
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <Music className="h-6 w-6 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold">{STEPS[currentStep].title}</h1>
        <p className="mt-1 text-zinc-500">{STEPS[currentStep].description}</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex justify-between text-xs text-zinc-400">
          {STEPS.map((step, i) => (
            <span
              key={i}
              className={i <= currentStep ? "text-orange-600 font-medium" : ""}
            >
              {i + 1}. {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Spotify message */}
      {spotifyMessage && (
        <div className={cn(
          "mb-4 rounded-md p-3 text-sm",
          spotifyImported
            ? "bg-green-50 text-green-700"
            : "bg-amber-50 text-amber-700"
        )}>
          {spotifyMessage}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Steps */}
      {currentStep === 0 && (
        <StepBands
          selectedBands={selectedBands}
          setSelectedBands={setSelectedBands}
          onNext={handleNext}
          spotifyImported={spotifyImported}
          onSpotifyConnect={handleSpotifyConnect}
        />
      )}

      {currentStep === 1 && (
        <StepLocation
          cityPreferences={cityPreferences}
          setCityPreferences={setCityPreferences}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 2 && (
        <StepPricing
          selectedBands={selectedBands}
          setSelectedBands={setSelectedBands}
          onSave={handleSavePreferences}
          onBack={handleBack}
          isSubmitting={isSubmitting}
        />
      )}

      {currentStep === 3 && (
        <StepComplete
          bandCount={selectedBands.length}
          dreamShowCount={selectedBands.filter((b) => b.isDreamShow).length}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
