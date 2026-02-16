"use client";

import { GuidedTour, WelcomeBanner, type TourStep } from "./guided-tour";
import { Sparkles } from "lucide-react";

const MY_SHOWS_TOUR_STEPS: TourStep[] = [
  {
    target: "my-shows-stats",
    title: "Your Dashboard",
    description:
      "This is your personal hub! Track your active pledges, dream shows, favorite artists, and total commitment at a glance.",
    placement: "bottom",
  },
  {
    target: "my-shows-preferences",
    title: "Set Your Preferences",
    description:
      "Tell us your favorite artists and genres, and which cities you want to see shows in. We'll use this to match you with upcoming events!",
    placement: "top",
  },
  {
    target: "my-shows-dream",
    title: "Dream Shows",
    description:
      "Dream up your perfect concert! Pick an artist, venue size, and price range — then share it with friends to build demand.",
    placement: "top",
  },
];

interface MyShowsTourProps {
  userId: string;
  /** Whether the user has set any preferences yet */
  hasPreferences: boolean;
  /** Whether the user has any pledges */
  hasPledges: boolean;
}

export function MyShowsTour({ userId, hasPreferences, hasPledges }: MyShowsTourProps) {
  return (
    <>
      {/* Welcome banner for brand-new users */}
      {!hasPledges && !hasPreferences && (
        <WelcomeBanner
          bannerId="my-shows-welcome"
          userId={userId}
          title="Welcome to Demand A Band!"
          description="This is your home base. Start by setting up your music preferences and location — we'll use them to recommend shows and let you know when your favorite artists are coming to town."
          icon={<Sparkles className="h-5 w-5 text-orange-600" />}
          actionLabel="Set Up Preferences"
          actionHref="/preferences"
        />
      )}

      {/* Guided tour for first-time visitors */}
      <GuidedTour
        tourId="my-shows"
        userId={userId}
        steps={MY_SHOWS_TOUR_STEPS}
        delay={1200}
      />
    </>
  );
}
