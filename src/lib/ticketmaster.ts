/**
 * Ticketmaster Discovery API client
 * Fetches real concert events for the Baltimore DMA and normalizes them
 * for caching in our ExternalEvent table.
 *
 * API docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 * Free tier: 5,000 calls/day, 5 req/sec
 */

const TM_BASE_URL = "https://app.ticketmaster.com/discovery/v2";

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

// Ticketmaster API response types (simplified)
interface TMImage {
  url: string;
  ratio?: string;
  width?: number;
  height?: number;
}

interface TMClassification {
  segment?: { name: string };
  genre?: { name: string };
  subGenre?: { name: string };
}

interface TMVenue {
  name: string;
  city?: { name: string };
  state?: { stateCode: string; name: string };
}

interface TMAttraction {
  name: string;
  classifications?: TMClassification[];
}

interface TMEvent {
  id: string;
  name: string;
  url?: string;
  images?: TMImage[];
  dates?: {
    start?: {
      localDate?: string; // "2026-03-15"
      localTime?: string; // "19:00:00"
    };
  };
  priceRanges?: Array<{
    min?: number;
    max?: number;
    currency?: string;
  }>;
  classifications?: TMClassification[];
  _embedded?: {
    venues?: TMVenue[];
    attractions?: TMAttraction[];
  };
}

interface TMResponse {
  _embedded?: {
    events?: TMEvent[];
  };
  page?: {
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

/**
 * Format a time string like "19:00:00" into "7:00 PM"
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

/**
 * Extract genres from TM classifications
 */
function extractGenres(event: TMEvent): string[] {
  const genres = new Set<string>();

  // From event classifications
  event.classifications?.forEach((c) => {
    if (c.genre?.name && c.genre.name !== "Undefined") {
      genres.add(c.genre.name);
    }
    if (c.subGenre?.name && c.subGenre.name !== "Undefined") {
      genres.add(c.subGenre.name);
    }
  });

  // From attraction classifications
  event._embedded?.attractions?.forEach((a) => {
    a.classifications?.forEach((c) => {
      if (c.genre?.name && c.genre.name !== "Undefined") {
        genres.add(c.genre.name);
      }
    });
  });

  return Array.from(genres);
}

/**
 * Pick the best image (prefer 16:9 ratio, reasonable size)
 */
function pickImage(images?: TMImage[]): string | null {
  if (!images || images.length === 0) return null;

  // Prefer 16_9 ratio with decent width
  const preferred = images.find(
    (img) => img.ratio === "16_9" && (img.width || 0) >= 640
  );
  if (preferred) return preferred.url;

  // Fall back to 3_2 or 4_3
  const fallback = images.find(
    (img) => (img.ratio === "3_2" || img.ratio === "4_3") && (img.width || 0) >= 300
  );
  if (fallback) return fallback.url;

  // Last resort: first image
  return images[0].url;
}

/**
 * Normalize a Ticketmaster event into our schema shape
 */
function normalizeEvent(event: TMEvent): NormalizedEvent | null {
  const venue = event._embedded?.venues?.[0];
  const attraction = event._embedded?.attractions?.[0];
  const localDate = event.dates?.start?.localDate;

  // Skip events without a date or venue
  if (!localDate || !venue) return null;

  // Artist name: prefer attraction name, fall back to event name
  const artistName = attraction?.name || event.name;

  // Parse the date
  const eventDate = new Date(localDate + "T00:00:00");

  // Format time
  const localTime = event.dates?.start?.localTime;
  const eventTime = localTime ? formatTime(localTime) : null;

  // Price range
  const priceRange = event.priceRanges?.[0];

  return {
    externalId: event.id,
    name: event.name,
    artistName,
    genres: extractGenres(event),
    venueName: venue.name || "Unknown Venue",
    venueCity: venue.city?.name || "Baltimore",
    venueState: venue.state?.stateCode || "MD",
    eventDate,
    eventTime,
    imageUrl: pickImage(event.images),
    ticketUrl: event.url || null,
    priceMin: priceRange?.min ?? null,
    priceMax: priceRange?.max ?? null,
  };
}

/**
 * Fetch music events from Ticketmaster for the Baltimore area.
 * Returns normalized events ready for DB upsert.
 */
export async function fetchBaltimoreEvents(): Promise<NormalizedEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.warn("TICKETMASTER_API_KEY not set — skipping external event fetch");
    return [];
  }

  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

  // TM requires format: "2026-02-15T00:00:00Z"
  const startDateTime = now.toISOString().split(".")[0] + "Z";
  const endDateTime = endDate.toISOString().split(".")[0] + "Z";

  const allEvents: NormalizedEvent[] = [];

  // Fetch up to 2 pages (400 events max)
  for (let page = 0; page < 2; page++) {
    const params = new URLSearchParams({
      apikey: apiKey,
      classificationName: "music",
      city: "Baltimore",
      stateCode: "MD",
      radius: "30",
      unit: "miles",
      startDateTime,
      endDateTime,
      size: "200",
      page: page.toString(),
      sort: "date,asc",
    });

    const url = `${TM_BASE_URL}/events.json?${params}`;

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.error(`Ticketmaster API error (page ${page}): ${res.status} ${res.statusText}`);
        break;
      }

      const data: TMResponse = await res.json();
      const events = data._embedded?.events || [];

      for (const event of events) {
        const normalized = normalizeEvent(event);
        if (normalized) {
          allEvents.push(normalized);
        }
      }

      // If we've fetched all pages, stop
      const totalPages = data.page?.totalPages || 1;
      if (page + 1 >= totalPages) break;

      // Brief delay between pages to respect rate limits
      if (page < 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } catch (error) {
      console.error(`Ticketmaster fetch error (page ${page}):`, error);
      break;
    }
  }

  console.log(`Fetched ${allEvents.length} events from Ticketmaster`);
  return allEvents;
}
