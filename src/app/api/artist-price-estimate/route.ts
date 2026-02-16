import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/artist-price-estimate?bandId=xxx&venueSize=club
 *
 * Estimates what fans might pay to see an artist in a given venue size.
 * Uses a composite model:
 *   1. Real ticket prices from cached external events (Ticketmaster + SeatGeek)
 *   2. Spotify popularity score as a scaling factor
 *   3. Venue size multiplier (intimate shows cost more per ticket)
 *
 * Returns a suggested per-ticket price for the dream show flow.
 */

// Mid-points for each venue size category
const VENUE_CAPACITY: Record<string, number> = {
  intimate: 100,
  club: 350,
  theater: 1000,
  large: 3000,
};

// Venue size multiplier — smaller venues mean higher per-ticket prices
// (to cover the same booking fee with fewer attendees)
const VENUE_MULTIPLIER: Record<string, number> = {
  intimate: 2.5,
  club: 1.4,
  theater: 1.0,
  large: 0.75,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bandId = searchParams.get("bandId");
  const venueSize = searchParams.get("venueSize") || "club";

  if (!bandId) {
    return NextResponse.json({ error: "bandId is required" }, { status: 400 });
  }

  try {
    // 1. Get the band's Spotify data
    const band = await prisma.band.findUnique({
      where: { id: bandId },
      select: {
        name: true,
        popularity: true,
        monthlyListeners: true,
      },
    });

    if (!band) {
      return NextResponse.json({ error: "Band not found" }, { status: 404 });
    }

    // 2. Search for this artist's events in our cached external events
    const artistEvents = await prisma.externalEvent.findMany({
      where: {
        artistName: { contains: band.name, mode: "insensitive" },
        priceMin: { not: null },
      },
      select: {
        priceMin: true,
        priceMax: true,
        venueName: true,
        source: true,
      },
    });

    // 3. Calculate average ticket prices from real data
    let avgTicketPrice: number | null = null;
    let dataSource: "direct" | "popularity" | "default" = "default";
    let priceDataPoints = 0;

    if (artistEvents.length > 0) {
      // We have real ticket price data for this artist
      const prices: number[] = [];
      for (const event of artistEvents) {
        if (event.priceMin) {
          prices.push(Number(event.priceMin));
        }
        if (event.priceMax) {
          prices.push(Number(event.priceMax));
        }
      }

      if (prices.length > 0) {
        avgTicketPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        dataSource = "direct";
        priceDataPoints = artistEvents.length;
      }
    }

    // 4. If no direct data, estimate from Spotify popularity
    if (avgTicketPrice === null && band.popularity !== null) {
      // Popularity 0-100 maps to roughly $20-$300 base ticket price
      // This is based on industry data: local acts ~$15-25, mid-tier ~$40-80,
      // major acts ~$80-200, stadium headliners ~$150-400
      const pop = band.popularity;
      if (pop >= 80) {
        avgTicketPrice = 120 + (pop - 80) * 8; // $120-$280
      } else if (pop >= 60) {
        avgTicketPrice = 50 + (pop - 60) * 3.5; // $50-$120
      } else if (pop >= 40) {
        avgTicketPrice = 30 + (pop - 40) * 1; // $30-$50
      } else if (pop >= 20) {
        avgTicketPrice = 20 + (pop - 20) * 0.5; // $20-$30
      } else {
        avgTicketPrice = 15 + pop * 0.25; // $15-$20
      }
      dataSource = "popularity";
    }

    // 5. Fallback: use a reasonable default
    if (avgTicketPrice === null) {
      avgTicketPrice = 45; // median concert ticket price
      dataSource = "default";
    }

    // 6. Apply venue size multiplier
    const multiplier = VENUE_MULTIPLIER[venueSize] ?? 1.0;
    const adjustedPrice = avgTicketPrice * multiplier;

    // 7. Round to nice numbers
    const suggestedPrice = roundToNicePrice(adjustedPrice);

    // 8. Create a price range (±25%)
    const priceLow = roundToNicePrice(adjustedPrice * 0.75);
    const priceHigh = roundToNicePrice(adjustedPrice * 1.35);

    // 9. Confidence level
    let confidence: "high" | "medium" | "low" = "low";
    if (dataSource === "direct" && priceDataPoints >= 2) {
      confidence = "high";
    } else if (dataSource === "direct" || (dataSource === "popularity" && (band.popularity ?? 0) > 30)) {
      confidence = "medium";
    }

    // 10. Generate human-readable explanation
    const explanation = buildExplanation(
      band.name,
      dataSource,
      priceDataPoints,
      band.popularity,
      venueSize,
      suggestedPrice
    );

    return NextResponse.json({
      suggestedPrice,
      priceLow,
      priceHigh,
      confidence,
      dataSource,
      priceDataPoints,
      explanation,
      meta: {
        bandName: band.name,
        popularity: band.popularity,
        monthlyListeners: band.monthlyListeners,
        venueSize,
        venueCapacity: VENUE_CAPACITY[venueSize] ?? 350,
        avgTicketPrice: Math.round(avgTicketPrice),
        multiplier,
      },
    });
  } catch (error) {
    console.error("Error estimating price:", error);
    return NextResponse.json(
      { error: "Failed to estimate price" },
      { status: 500 }
    );
  }
}

/**
 * Round to a "nice" price: $5 increments under $50, $10 increments under $200,
 * $25 increments under $500, $50 increments above
 */
function roundToNicePrice(price: number): number {
  if (price < 25) return Math.max(15, Math.round(price / 5) * 5);
  if (price < 50) return Math.round(price / 5) * 5;
  if (price < 200) return Math.round(price / 10) * 10;
  if (price < 500) return Math.round(price / 25) * 25;
  return Math.round(price / 50) * 50;
}

function buildExplanation(
  bandName: string,
  dataSource: string,
  dataPoints: number,
  popularity: number | null,
  venueSize: string,
  suggestedPrice: number
): string {
  const venueName = venueSize === "intimate" ? "an intimate" :
    venueSize === "club" ? "a club" :
    venueSize === "theater" ? "a theater" :
    "a large";

  if (dataSource === "direct") {
    return `Based on ${dataPoints} real show${dataPoints > 1 ? "s" : ""} with ticket data for ${bandName}, we estimate ~$${suggestedPrice}/ticket for ${venueName} show.`;
  }

  if (dataSource === "popularity") {
    const popLabel = (popularity ?? 0) >= 80 ? "very high" :
      (popularity ?? 0) >= 60 ? "high" :
      (popularity ?? 0) >= 40 ? "moderate" : "growing";
    return `Based on ${bandName}'s ${popLabel} popularity, we estimate ~$${suggestedPrice}/ticket for ${venueName} show.`;
  }

  return `We estimate ~$${suggestedPrice}/ticket for ${venueName} show. Add more shows to improve this estimate!`;
}
