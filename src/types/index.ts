import type {
  User, Band, Venue, Event, Pledge,
  UserBandPreference, UserCityPreference, Notification,
  EventStatus, PledgeStatus, UserRole, VenueOwnership,
  NotificationType
} from "@prisma/client";

// Re-export Prisma types
export type {
  User, Band, Venue, Event, Pledge,
  UserBandPreference, UserCityPreference, Notification,
  EventStatus, PledgeStatus, UserRole, VenueOwnership,
  NotificationType
};

// Extended types with relations
export type EventWithRelations = Event & {
  band: Band;
  venue: Venue;
  pledges: Pledge[];
  _count?: {
    pledges: number;
  };
};

export type PledgeWithRelations = Pledge & {
  event: EventWithRelations;
  user: Pick<User, "id" | "name" | "email">;
};

export type BandWithDemand = Band & {
  _count: {
    userPreferences: number;
  };
  demandCount?: number;
  avgPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  medianPrice?: number;
  dreamShowCount?: number;
};

export type VenueWithEvents = Venue & {
  events: Event[];
  _count: {
    events: number;
  };
};

// API response types
export type DemandData = {
  bandId: string;
  bandName: string;
  bandSlug: string;
  genres: string[];
  imageUrl: string | null;
  demandCount: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  dreamShowCount: number;
  dreamShowAvgPrice: number;
};

export type PlatformStats = {
  totalUsers: number;
  totalBands: number;
  totalVenues: number;
  totalEvents: number;
  activeEvents: number;
  totalPledges: number;
  activePledges: number;
  totalRevenue: number;
  recentSignups: number;
};

// NextAuth augmentation is in src/types/next-auth.d.ts
