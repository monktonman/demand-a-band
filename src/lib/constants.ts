export const APP_NAME = "Demand A Band";
export const APP_DESCRIPTION =
  "Tell us what bands you want to see, where, and for how much. We make it happen.";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const GENRES = [
  "Alternative",
  "Americana",
  "Blues",
  "Classical",
  "Country",
  "Electronic",
  "Experimental",
  "Folk",
  "Funk",
  "Hip-Hop",
  "Indie Rock",
  "Jazz",
  "Metal",
  "Pop",
  "Punk",
  "R&B/Soul",
  "Rock",
  "Singer-Songwriter",
  "World Music",
] as const;

export const VENUE_TYPES = [
  "Club",
  "Concert Hall",
  "Theater",
  "Arts Center",
  "Bar with Stage",
  "Listening Room",
  "Brewery/Taproom",
  "DIY Space",
  "Restaurant with Stage",
  "Outdoor Venue",
] as const;

export const EVENT_STATUS_LABELS = {
  PROPOSED: "Open for Pledges",
  THRESHOLD_MET: "Threshold Met!",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
} as const;

export const EVENT_STATUS_COLORS = {
  PROPOSED: "bg-blue-100 text-blue-800",
  THRESHOLD_MET: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
} as const;

export const MIN_BANDS_ONBOARDING = 3;
export const DEFAULT_MAX_RADIUS = 30;
export const DEFAULT_TICKET_PRICE = 25;
export const MAX_TICKET_PRICE = 10000;

export const PRICE_QUICK_OPTIONS = [15, 25, 40, 60, 100, 250, 500, 1000];

export const DREAM_SHOW_MIN_PRICE = 100;

// Email rate limiting — delay (ms) between sends in batch notifications.
// Resend free tier: 2 emails/sec → 600ms delay.
// TODO: Set to 0 when upgrading to Resend Pro (50+/sec).
export const EMAIL_RATE_LIMIT_MS = 600;
