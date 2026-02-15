import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBaltimoreEvents } from "@/lib/ticketmaster";
import { fetchBaltimoreSeatGeekEvents } from "@/lib/seatgeek";

const CACHE_MAX_AGE_HOURS = 6;

/**
 * GET: Return cached external events (future dates only)
 * Also auto-refreshes the cache if it's stale (> 6 hours old)
 */
export async function GET() {
  try {
    // Check if cache needs refreshing
    const mostRecent = await prisma.externalEvent.findFirst({
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    });

    const cacheAge = mostRecent
      ? (Date.now() - mostRecent.fetchedAt.getTime()) / (1000 * 60 * 60)
      : Infinity;

    // Auto-refresh if stale
    if (cacheAge > CACHE_MAX_AGE_HOURS) {
      await syncExternalEvents();
    }

    // Return cached events, deduplicated by artist+venue+date
    const events = await prisma.externalEvent.findMany({
      where: {
        eventDate: { gte: new Date() },
      },
      orderBy: { eventDate: "asc" },
    });

    // Deduplicate: if both TM and SeatGeek have the same show, keep the one with more data
    const deduped = deduplicateEvents(events);

    // Serialize for client
    const serialized = deduped.map((e) => ({
      ...e,
      eventDate: e.eventDate.toISOString(),
      fetchedAt: e.fetchedAt.toISOString(),
      createdAt: e.createdAt.toISOString(),
      priceMin: e.priceMin?.toString() ?? null,
      priceMax: e.priceMax?.toString() ?? null,
    }));

    return NextResponse.json({ events: serialized });
  } catch (error) {
    console.error("Error fetching external events:", error);
    return NextResponse.json(
      { error: "Failed to fetch external events" },
      { status: 500 }
    );
  }
}

/**
 * POST: Force-refresh the external events cache
 * (Open to anyone for now — in production, lock to admin/cron)
 */
export async function POST() {
  try {
    const result = await syncExternalEvents();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing external events:", error);
    return NextResponse.json(
      { error: "Failed to sync external events" },
      { status: 500 }
    );
  }
}

/**
 * Deduplicate events that appear in both Ticketmaster and SeatGeek.
 * Uses artist name + venue name + event date as the dedup key.
 * Keeps the event with more data (image, price, etc.)
 */
function deduplicateEvents<
  T extends {
    artistName: string;
    venueName: string;
    eventDate: Date;
    imageUrl: string | null;
    priceMin: unknown;
    ticketUrl: string | null;
  }
>(events: T[]): T[] {
  const seen = new Map<string, T>();

  for (const event of events) {
    // Normalize: lowercase artist + venue + date for matching
    const key = [
      event.artistName.toLowerCase().trim(),
      event.venueName.toLowerCase().trim(),
      event.eventDate.toISOString().split("T")[0],
    ].join("|");

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, event);
    } else {
      // Keep the one with more data (image > no image, price > no price)
      const existingScore =
        (existing.imageUrl ? 1 : 0) +
        (existing.priceMin ? 1 : 0) +
        (existing.ticketUrl ? 1 : 0);
      const newScore =
        (event.imageUrl ? 1 : 0) +
        (event.priceMin ? 1 : 0) +
        (event.ticketUrl ? 1 : 0);

      if (newScore > existingScore) {
        seen.set(key, event);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Fetch from all configured sources, upsert into DB, clean old events
 */
async function syncExternalEvents() {
  // Fetch from all sources in parallel
  const [tmEvents, sgEvents] = await Promise.all([
    fetchBaltimoreEvents(),
    fetchBaltimoreSeatGeekEvents(),
  ]);

  const totalFetched = tmEvents.length + sgEvents.length;
  if (totalFetched === 0) {
    return {
      synced: 0,
      sources: { ticketmaster: 0, seatgeek: 0 },
      message: "No events fetched (API keys missing or no results)",
    };
  }

  const now = new Date();
  let upserted = 0;

  // Helper: upsert events for a given source
  async function upsertEvents(
    events: typeof tmEvents,
    source: string
  ) {
    let count = 0;
    for (const event of events) {
      await prisma.externalEvent.upsert({
        where: {
          externalId_source: {
            externalId: event.externalId,
            source,
          },
        },
        update: {
          name: event.name,
          artistName: event.artistName,
          genres: event.genres,
          venueName: event.venueName,
          venueCity: event.venueCity,
          venueState: event.venueState,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          imageUrl: event.imageUrl,
          ticketUrl: event.ticketUrl,
          priceMin: event.priceMin,
          priceMax: event.priceMax,
          fetchedAt: now,
        },
        create: {
          externalId: event.externalId,
          source,
          name: event.name,
          artistName: event.artistName,
          genres: event.genres,
          venueName: event.venueName,
          venueCity: event.venueCity,
          venueState: event.venueState,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          imageUrl: event.imageUrl,
          ticketUrl: event.ticketUrl,
          priceMin: event.priceMin,
          priceMax: event.priceMax,
          fetchedAt: now,
        },
      });
      count++;
    }
    return count;
  }

  // Upsert from both sources
  const [tmCount, sgCount] = await Promise.all([
    upsertEvents(tmEvents, "ticketmaster"),
    upsertEvents(sgEvents, "seatgeek"),
  ]);
  upserted = tmCount + sgCount;

  // Clean up past events (older than yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const deleted = await prisma.externalEvent.deleteMany({
    where: { eventDate: { lt: yesterday } },
  });

  return {
    synced: upserted,
    sources: { ticketmaster: tmCount, seatgeek: sgCount },
    cleaned: deleted.count,
    message: `Synced ${upserted} events (TM: ${tmCount}, SG: ${sgCount}), cleaned ${deleted.count} past events`,
  };
}
