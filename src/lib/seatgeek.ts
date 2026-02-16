/**
 * SeatGeek Platform API client
 * Fetches real concert events for Baltimore and normalizes them
 * for caching in our ExternalEvent table.
 *
 * API docs: https://platform.seatgeek.com/
 * Free tier: self-service key at seatgeek.com/account/develop
 * Good indie venue coverage — SeatGeek powers ticketing for many independent spots.
 */

const SG_BASE_URL = "https://api.seatgeek.com/2";

export interface NormalizedEvent {
  externalId: string;
  name: string;
  artistName: string;
  genres: string[];
  venueName: string;
  venueCity: string;
  venueState: string;
  eventDate: Date;
  eventTime: string | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
}

// SeatGeek response types (simplified)
interface SGPerformer {
  name: string;
  short_name: string;
  image?: string;
  genres?: Array<{ name: string; slug: string }>;
  taxonomies?: Array<{ name: string }>;
}

interface SGVenue {
  name: string;
  city: string;
  state: string;
  country: string;
  address?: string;
  postal_code?: string;
}

interface SGEvent {
  id: number;
  title: string;
  short_title: string;
  url: string;
  datetime_local: string; // "2026-03-15T19:00:00"
  datetime_utc: string;
  venue: SGVenue;
  performers: SGPerformer[];
  stats: {
    listing_count?: number;
    average_price?: number;
    lowest_price?: number;
    highest_price?: number;
  };
  type: string;
  taxonomies?: Array<{ name: string }>;
}

interface SGResponse {
  events: SGEvent[];
  meta: {
    total: number;
    took: number;
    page: number;
    per_page: number;
  };
}

/**
 * Format a datetime string like "2026-03-15T19:00:00" into "7:00 PM"
 */
function formatTime(datetime: string): string | null {
  const match = datetime.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1]);
  const minutes = match[2];
  // Skip midnight/noon (often means time TBA)
  if (hours === 0 && minutes === "00") return null;
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

/**
 * Extract genres from SeatGeek performers and taxonomies
 */
function extractGenres(event: SGEvent): string[] {
  const genres = new Set<string>();

  // From performers
  event.performers?.forEach((p) => {
    p.genres?.forEach((g) => {
      if (g.name) genres.add(g.name);
    });
  });

  // From event taxonomies
  event.taxonomies?.forEach((t) => {
    if (t.name && t.name !== "concert" && t.name !== "Concert") {
      genres.add(t.name);
    }
  });

  return Array.from(genres);
}

/**
 * Normalize a SeatGeek event into our schema shape
 */
function normalizeEvent(event: SGEvent): NormalizedEvent | null {
  if (!event.venue || !event.datetime_local) return null;

  // Artist name: use first performer, fall back to event title
  const primaryPerformer = event.performers?.[0];
  const artistName = primaryPerformer?.short_name || primaryPerformer?.name || event.short_title || event.title;

  // Parse the date (SG gives us "2026-03-15T19:00:00")
  const datePart = event.datetime_local.split("T")[0];
  const eventDate = new Date(datePart + "T00:00:00");

  // Get time
  const eventTime = formatTime(event.datetime_local);

  // Image from primary performer
  const imageUrl = primaryPerformer?.image || null;

  return {
    externalId: `sg-${event.id}`,
    name: event.title,
    artistName,
    genres: extractGenres(event),
    venueName: event.venue.name,
    venueCity: event.venue.city,
    venueState: event.venue.state,
    eventDate,
    eventTime,
    imageUrl,
    ticketUrl: event.url || null,
    priceMin: event.stats?.lowest_price ?? null,
    priceMax: event.stats?.highest_price ?? null,
  };
}

/**
 * Mid-Atlantic metro areas to fetch events from.
 * SeatGeek supports lat/lon with range parameter for geographic search.
 */
const SG_METRO_AREAS = [
  { label: "Baltimore", lat: "39.29", lon: "-76.61", range: "30mi" },
  { label: "Washington DC", lat: "38.90", lon: "-77.04", range: "25mi" },
  { label: "Philadelphia", lat: "39.95", lon: "-75.17", range: "25mi" },
  { label: "Richmond", lat: "37.54", lon: "-77.44", range: "20mi" },
  { label: "Norfolk/VA Beach", lat: "36.85", lon: "-76.29", range: "20mi" },
];

/**
 * Fetch music events from SeatGeek for the mid-Atlantic region.
 * Returns normalized events ready for DB upsert.
 */
export async function fetchBaltimoreSeatGeekEvents(): Promise<NormalizedEvent[]> {
  const clientId = process.env.SEATGEEK_CLIENT_ID;
  if (!clientId) {
    console.warn("SEATGEEK_CLIENT_ID not set — skipping SeatGeek event fetch");
    return [];
  }

  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

  // SeatGeek uses format: "2026-02-15"
  const startDate = now.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  const allEvents: NormalizedEvent[] = [];
  const seenIds = new Set<number>();

  for (const metro of SG_METRO_AREAS) {
    // Fetch up to 2 pages per metro (500 events per page max)
    for (let page = 1; page <= 2; page++) {
      const params = new URLSearchParams({
        client_id: clientId,
        lat: metro.lat,
        lon: metro.lon,
        range: metro.range,
        "taxonomies.name": "concert",
        "datetime_local.gte": startDate,
        "datetime_local.lte": endDateStr,
        per_page: "500",
        page: page.toString(),
        sort: "datetime_local.asc",
      });

      const url = `${SG_BASE_URL}/events?${params}`;

      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          console.error(`SeatGeek API error (${metro.label}, page ${page}): ${res.status} ${res.statusText}`);
          break;
        }

        const data: SGResponse = await res.json();

        for (const event of data.events) {
          // Deduplicate across metros (same event ID)
          if (seenIds.has(event.id)) continue;
          seenIds.add(event.id);

          const normalized = normalizeEvent(event);
          if (normalized) {
            allEvents.push(normalized);
          }
        }

        // If we've fetched all events, stop
        if (data.events.length < 500 || page * 500 >= data.meta.total) break;

        // Brief delay between pages
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (error) {
        console.error(`SeatGeek fetch error (${metro.label}, page ${page}):`, error);
        break;
      }
    }

    // Delay between metros
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`Fetched ${allEvents.length} events from SeatGeek (${SG_METRO_AREAS.length} metros)`);
  return allEvents;
}
