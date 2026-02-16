"use client";

import { GuidedTour, type TourStep } from "./guided-tour";

const STEP_GENRES_TOUR: TourStep[] = [
  {
    target: "onboarding-concept",
    title: "How Demand A Band Works",
    description:
      "Fans like you vote for the artists they want to see live. When enough people pledge, we book the show! Start by telling us what genres you love.",
    placement: "bottom",
  },
  {
    target: "onboarding-genres",
    title: "Pick Your Genres",
    description:
      "Tap the genres you enjoy — rock, hip-hop, indie, jazz, whatever you're into. We'll use these to recommend shows and match you with events, even from artists you haven't discovered yet.",
    placement: "bottom",
  },
];

const STEP_BANDS_TOUR: TourStep[] = [
  {
    target: "onboarding-browse",
    title: "Find Artists",
    description:
      "The \"For You\" tab shows artists matching your genres. You can also browse popular artists, search by name, or connect Spotify. Tap any artist card to select them.",
    placement: "top",
  },
  {
    target: "onboarding-selections",
    title: "Your Selections",
    description:
      "Your chosen artists appear here. This step is optional — you can skip it and come back later from your settings.",
    placement: "bottom",
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
  step: "genres" | "bands" | "location";
}

export function OnboardingTour({ step }: OnboardingTourProps) {
  const stepsMap = {
    genres: STEP_GENRES_TOUR,
    bands: STEP_BANDS_TOUR,
    location: STEP_LOCATION_TOUR,
  };

  const steps = stepsMap[step];
  const tourId = `onboarding-${step}`;

  return <GuidedTour tourId={tourId} steps={steps} delay={600} />;
}
