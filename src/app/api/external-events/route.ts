import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBaltimoreEvents } from "@/lib/ticketmaster";

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

    // Return cached events
    const events = await prisma.externalEvent.findMany({
      where: {
        eventDate: { gte: new Date() },
      },
      orderBy: { eventDate: "asc" },
    });

    // Serialize for client
    const serialized = events.map((e) => ({
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
 * Fetch from Ticketmaster, upsert into DB, clean old events
 */
async function syncExternalEvents() {
  const events = await fetchBaltimoreEvents();

  if (events.length === 0) {
    return { synced: 0, message: "No events fetched (API key missing or no results)" };
  }

  const now = new Date();
  let upserted = 0;

  // Upsert all fetched events
  for (const event of events) {
    await prisma.externalEvent.upsert({
      where: { externalId: event.externalId },
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
    upserted++;
  }

  // Clean up past events (older than yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const deleted = await prisma.externalEvent.deleteMany({
    where: { eventDate: { lt: yesterday } },
  });

  return {
    synced: upserted,
    cleaned: deleted.count,
    message: `Synced ${upserted} events, cleaned ${deleted.count} past events`,
  };
}
