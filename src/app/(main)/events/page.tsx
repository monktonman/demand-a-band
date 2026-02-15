import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventsView } from "@/components/events/events-view";
import { Music } from "lucide-react";

export const dynamic = "force-dynamic";

// Cache stale threshold in hours
const CACHE_MAX_AGE_HOURS = 6;

export default async function EventsPage() {
  // Fetch session + DAB events + external events in parallel
  const [session, events, externalEvents, cacheInfo] = await Promise.all([
    getServerSession(authOptions),
    prisma.event.findMany({
      where: {
        status: { in: ["PROPOSED", "THRESHOLD_MET", "CONFIRMED"] },
      },
      include: {
        band: true,
        venue: true,
        _count: { select: { pledges: true } },
      },
      orderBy: { eventDate: "asc" },
    }),
    prisma.externalEvent.findMany({
      where: {
        eventDate: { gte: new Date() },
      },
      orderBy: { eventDate: "asc" },
    }),
    // Check if cache needs refreshing
    prisma.externalEvent.findFirst({
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    }),
  ]);

  // Fetch user preferences if logged in
  const userId = session?.user?.id;
  const [genrePrefs, bandPrefs] = userId
    ? await Promise.all([
        prisma.userGenrePreference.findMany({
          where: { userId },
          select: { genre: true },
        }),
        prisma.userBandPreference.findMany({
          where: { userId },
          include: { band: { select: { name: true } } },
        }),
      ])
    : [[], []];

  const userGenres = genrePrefs.map((g) => g.genre.toLowerCase());
  const userBandNames = bandPrefs.map((b) => b.band.name.toLowerCase());

  // Trigger background cache refresh if stale
  const cacheAge = cacheInfo
    ? (Date.now() - cacheInfo.fetchedAt.getTime()) / (1000 * 60 * 60)
    : Infinity;

  if (cacheAge > CACHE_MAX_AGE_HOURS) {
    // Fire-and-forget refresh (don't block page render)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    fetch(`${baseUrl}/api/external-events`, { method: "POST" }).catch(() => {
      // Silently fail — page still renders with stale/empty cache
    });
  }

  // Serialize DAB events
  const serializedEvents = events.map((e) => ({
    ...e,
    eventDate: e.eventDate.toISOString(),
    windowStart: e.windowStart?.toISOString() ?? null,
    windowEnd: e.windowEnd?.toISOString() ?? null,
    ticketPrice: e.ticketPrice.toString(),
    serviceFee: e.serviceFee.toString(),
    pledgeDeadline: e.pledgeDeadline.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    confirmedAt: e.confirmedAt?.toISOString() ?? null,
    cancelledAt: e.cancelledAt?.toISOString() ?? null,
    doorsTime: e.doorsTime?.toISOString() ?? null,
    showTime: e.showTime?.toISOString() ?? null,
  }));

  // Serialize external events with match computation
  const serializedExternalEvents = externalEvents.map((e) => {
    // Check if event matches user preferences (genre or artist name)
    const eventGenresLower = e.genres.map((g) => g.toLowerCase());
    const artistLower = e.artistName.toLowerCase();
    const genreMatch = userGenres.some((ug) =>
      eventGenresLower.some((eg) => eg.includes(ug) || ug.includes(eg))
    );
    const bandMatch = userBandNames.some(
      (bn) => artistLower.includes(bn) || bn.includes(artistLower)
    );

    return {
      id: e.id,
      externalId: e.externalId,
      name: e.name,
      artistName: e.artistName,
      genres: e.genres,
      venueName: e.venueName,
      venueCity: e.venueCity,
      venueState: e.venueState,
      eventDate: e.eventDate.toISOString(),
      eventTime: e.eventTime,
      imageUrl: e.imageUrl,
      ticketUrl: e.ticketUrl,
      priceMin: e.priceMin?.toString() ?? null,
      priceMax: e.priceMax?.toString() ?? null,
      source: e.source,
      matchesPreferences: genreMatch || bandMatch,
    };
  });

  // Collect all unique genres from external events for the filter
  const allGenres = Array.from(
    new Set(externalEvents.flatMap((e) => e.genres).filter(Boolean))
  ).sort();

  const totalShows = events.length + externalEvents.length;
  const hasPreferences = userGenres.length > 0 || userBandNames.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Shows</h1>
        <p className="mt-2 text-zinc-500">
          {externalEvents.length > 0
            ? `${totalShows} upcoming shows in the Baltimore area. Pledge for DAB shows or grab tickets to confirmed concerts.`
            : "Browse proposed and upcoming shows. Commit your support to make them happen."}
        </p>
      </div>

      {totalShows > 0 ? (
        <EventsView
          events={serializedEvents}
          externalEvents={serializedExternalEvents}
          allGenres={allGenres}
          hasPreferences={hasPreferences}
          userGenres={genrePrefs.map((g) => g.genre)}
        />
      ) : (
        <div className="py-24 text-center">
          <Music className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
          <h2 className="text-xl font-semibold text-zinc-700">
            No shows yet
          </h2>
          <p className="mt-2 text-zinc-500">
            Shows will appear here once we have enough demand from fans
            like you. Set your music preferences to help us find shows for your market!
          </p>
        </div>
      )}
    </div>
  );
}
