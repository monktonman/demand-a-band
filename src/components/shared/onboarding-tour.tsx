"use client";

import { GuidedTour, type TourStep } from "./guided-tour";

const STEP_BANDS_TOUR: TourStep[] = [
  {
    target: "onboarding-concept",
    title: "How Demand A Band Works",
    description:
      "Fans like you vote for the artists they want to see live. When enough people pledge, we book the show! Your preferences help us know which artists to bring to Baltimore.",
    placement: "bottom",
  },
  {
    target: "onboarding-genres",
    title: "Pick Your Genres",
    description:
      "Select the genres you love — rock, hip-hop, indie, jazz, whatever you're into. We'll use these to recommend shows and match you with events.",
    placement: "bottom",
  },
  {
    target: "onboarding-selections",
    title: "Your Selections",
    description:
      "Your chosen genres and artists appear here. You need at least 3 artists to continue. The more you pick, the better we can match you!",
    placement: "bottom",
  },
  {
    target: "onboarding-browse",
    title: "Find Artists",
    description:
      "Browse popular artists, search by name, filter by genre, or connect Spotify to auto-import from your listening history. Tap any artist card to select them.",
    placement: "top",
  },
];

const STEP_LOCATION_TOUR: TourStep[] = [
  {
    target: "onboarding-cities",
    title: "Your Home Base",
    description:
      "We start with Baltimore, but you can add more cities! We'll notify you about shows within your travel radius of each city.",
    placement: "bottom",
  },
  {
    target: "onboarding-radius",
    title: "Set Your Range",
    description:
      "Drag the slider to set how far you're willing to travel for a show. A bigger radius means more options!",
    placement: "bottom",
  },
  {
    target: "onboarding-suggested-cities",
    title: "Quick Add Cities",
    description:
      "Tap any of these nearby cities to add them. You can also type in any city you like below.",
    placement: "top",
  },
];

interface OnboardingTourProps {
  step: "bands" | "location";
}

export function OnboardingTour({ step }: OnboardingTourProps) {
  const steps = step === "bands" ? STEP_BANDS_TOUR : STEP_LOCATION_TOUR;
  const tourId = `onboarding-${step}`;

  return (
    <GuidedTour
      tourId={tourId}
      steps={steps}
      delay={600}
    />
  );
}
