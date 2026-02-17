import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Get most-demanded bands with aggregated stats
export async function getMostDemandedBands(limit = 20) {
  const bands = await prisma.band.findMany({
    include: {
      _count: {
        select: { userPreferences: true },
      },
      userPreferences: {
        select: {
          maxTicketPrice: true,
          isDreamShow: true,
        },
      },
    },
    orderBy: {
      userPreferences: {
        _count: "desc",
      },
    },
    take: limit,
  });

  return bands
    .filter((band) => band._count.userPreferences > 0)
    .map((band) => {
      const prefs = band.userPreferences;
      const dreamShowPrefs = prefs.filter((p) => p.isDreamShow);
      const avgPrice =
        prefs.length > 0
          ? prefs.reduce((sum, p) => sum + Number(p.maxTicketPrice), 0) / prefs.length
          : 0;
      const maxPrice =
        prefs.length > 0
          ? Math.max(...prefs.map((p) => Number(p.maxTicketPrice)))
          : 0;
      const dreamShowAvgPrice =
        dreamShowPrefs.length > 0
          ? dreamShowPrefs.reduce((sum, p) => sum + Number(p.maxTicketPrice), 0) /
            dreamShowPrefs.length
          : 0;

      return {
        id: band.id,
        name: band.name,
        slug: band.slug,
        genres: band.genres,
        imageUrl: band.imageUrl,
        popularity: band.popularity,
        demandCount: band._count.userPreferences,
        avgPrice: Math.round(avgPrice),
        maxPrice,
        dreamShowCount: dreamShowPrefs.length,
        dreamShowAvgPrice: Math.round(dreamShowAvgPrice),
      };
    });
}

// Get dream show demand signals (the wow data)
export async function getDreamShowDemand() {
  const bands = await prisma.band.findMany({
    where: {
      userPreferences: {
        some: {
          isDreamShow: true,
        },
      },
    },
    include: {
      userPreferences: {
        where: { isDreamShow: true },
        select: {
          maxTicketPrice: true,
        },
      },
    },
    orderBy: {
      userPreferences: {
        _count: "desc",
      },
    },
  });

  return bands.map((band) => {
    const prices = band.userPreferences.map((p) => Number(p.maxTicketPrice));
    return {
      id: band.id,
      name: band.name,
      genres: band.genres,
      fanCount: prices.length,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      maxPrice: Math.max(...prices),
      minPrice: Math.min(...prices),
      totalRevenuePotential: prices.reduce((a, b) => a + b, 0),
    };
  });
}

// Get price distribution for a specific band
export async function getBandPriceDistribution(bandId: string) {
  const prefs = await prisma.userBandPreference.findMany({
    where: { bandId },
    select: { maxTicketPrice: true, isDreamShow: true },
  });

  // Create price buckets
  const buckets = [
    { label: "$15-25", min: 15, max: 25 },
    { label: "$25-50", min: 25, max: 50 },
    { label: "$50-100", min: 50, max: 100 },
    { label: "$100-250", min: 100, max: 250 },
    { label: "$250-500", min: 250, max: 500 },
    { label: "$500+", min: 500, max: Infinity },
  ];

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: prefs.filter(
      (p) => Number(p.maxTicketPrice) >= bucket.min && Number(p.maxTicketPrice) < bucket.max
    ).length,
    dreamShowCount: prefs.filter(
      (p) =>
        Number(p.maxTicketPrice) >= bucket.min &&
        Number(p.maxTicketPrice) < bucket.max &&
        p.isDreamShow
    ).length,
  }));
}

// Get platform-wide stats
export async function getPlatformStats() {
  const [
    userCount,
    bandCount,
    venueCount,
    eventCount,
    pledgeCount,
    preferenceCount,
    dreamShowCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.FAN } }),
    prisma.band.count(),
    prisma.venue.count(),
    prisma.event.count(),
    prisma.pledge.count(),
    prisma.userBandPreference.count(),
    prisma.userBandPreference.count({ where: { isDreamShow: true } }),
  ]);

  return {
    userCount,
    bandCount,
    venueCount,
    eventCount,
    pledgeCount,
    preferenceCount,
    dreamShowCount,
  };
}

// Get genre demand — count unique users per genre from both direct preferences and band selections
export async function getGenreDemand() {
  // Source 1: Direct genre preferences — get userId + genre pairs
  const genrePrefs = await prisma.userGenrePreference.findMany({
    select: { userId: true, genre: true },
  });

  // Source 2: Band preferences with band genres — get userId + band genres
  const bandPrefsWithGenres = await prisma.userBandPreference.findMany({
    where: {
      band: { genres: { isEmpty: false } },
    },
    select: {
      userId: true,
      band: { select: { genres: true } },
    },
  });

  // Build a map of genre → Set of unique userIds
  const genreUserMap = new Map<string, Set<string>>();

  // Add users from direct genre selections
  for (const pref of genrePrefs) {
    if (!genreUserMap.has(pref.genre)) {
      genreUserMap.set(pref.genre, new Set());
    }
    genreUserMap.get(pref.genre)!.add(pref.userId);
  }

  // Add users from band selections (implied genre interest)
  for (const pref of bandPrefsWithGenres) {
    for (const genre of pref.band.genres) {
      if (!genreUserMap.has(genre)) {
        genreUserMap.set(genre, new Set());
      }
      genreUserMap.get(genre)!.add(pref.userId);
    }
  }

  // Convert to sorted array by unique user count
  return Array.from(genreUserMap.entries())
    .map(([genre, userIds]) => ({
      genre,
      uniqueUsers: userIds.size,
    }))
    .sort((a, b) => b.uniqueUsers - a.uniqueUsers);
}

// Get demand by city
export async function getDemandByCity() {
  const cities = await prisma.userCityPreference.groupBy({
    by: ["city", "state"],
    _count: { userId: true },
    orderBy: { _count: { userId: "desc" } },
  });

  return cities.map((c) => ({
    city: c.city,
    state: c.state,
    fanCount: c._count.userId,
  }));
}
