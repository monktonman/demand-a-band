"use client";

import { GuidedTour, WelcomeBanner, type TourStep } from "./guided-tour";
import { Music } from "lucide-react";

const EVENTS_TOUR_STEPS: TourStep[] = [
  {
    target: "events-tabs",
    title: "Browse Shows",
    description:
      "Switch between DAB Shows (crowd-funded events you can pledge for) and the Concert Calendar (confirmed shows in the Baltimore area).",
    placement: "bottom",
  },
  {
    target: "events-filters",
    title: "Filter & Search",
    description:
      "Use filters to find shows by genre, date, or your preferences. Toggle 'My Matches' to see events that match your favorite artists and genres.",
    placement: "bottom",
  },
];

interface EventsTourProps {
  userId?: string;
  isLoggedIn: boolean;
  hasPreferences: boolean;
}

export function EventsTour({ userId, isLoggedIn, hasPreferences }: EventsTourProps) {
  // Only show tour for logged-in users
  if (!isLoggedIn) return null;

  return (
    <>
      {/* Welcome banner for users who just finished onboarding */}
      {!hasPreferences && (
        <WelcomeBanner
          bannerId="events-welcome"
          userId={userId}
          title="Welcome to the Shows page!"
          description="Here you'll find all upcoming shows in the Baltimore area. Set up your music preferences to see personalized matches highlighted just for you."
          icon={<Music className="h-5 w-5 text-orange-600" />}
          actionLabel="Set Up Preferences"
          actionHref="/preferences"
        />
      )}

      {hasPreferences && (
        <WelcomeBanner
          bannerId="events-welcome-prefs"
          userId={userId}
          title="Your personalized show feed is ready!"
          description="We've matched shows to your taste. Look for the 'My Matches' filter to see events featuring your favorite artists and genres. Pledge for DAB shows to help make them happen!"
          icon={<Music className="h-5 w-5 text-orange-600" />}
        />
      )}

      {/* Step-by-step tour */}
      <GuidedTour
        tourId="events"
        userId={userId}
        steps={EVENTS_TOUR_STEPS}
        delay={1500}
      />
    </>
  );
}
