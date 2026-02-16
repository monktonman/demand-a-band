import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { notifyMatchingFans } from "@/lib/notifications";

// GET: List events (public)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const events = await prisma.event.findMany({
    where: status ? { status: status as "PROPOSED" | "THRESHOLD_MET" | "CONFIRMED" | "CANCELLED" | "COMPLETED" } : undefined,
    include: {
      band: true,
      venue: true,
      _count: { select: { pledges: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  // Compute actual ticket counts (sum of quantities, not row count)
  const ticketSums = await prisma.pledge.groupBy({
    by: ["eventId"],
    where: { status: { in: ["ACTIVE", "CHARGED"] } },
    _sum: { quantity: true },
  });
  const ticketMap = Object.fromEntries(
    ticketSums.map((e) => [e.eventId, e._sum.quantity || 0])
  );

  const enrichedEvents = events.map((e) => ({
    ...e,
    ticketCount: ticketMap[e.id] || 0,
  }));

  return NextResponse.json({ events: enrichedEvents });
}

// POST: Create event (admin or operator)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = createEventSchema.parse(body);

    // Generate slug from title
    const slug = slugify(validatedData.title);

    // Calculate service fee
    const ticketPrice = validatedData.ticketPrice;
    const serviceFee = ticketPrice < 15 ? 3.5 : Math.round(ticketPrice * 0.12 * 100) / 100;

    const event = await prisma.event.create({
      data: {
        bandId: validatedData.bandId,
        venueId: validatedData.venueId,
        title: validatedData.title,
        slug,
        description: validatedData.description || "",
        windowStart: validatedData.windowStart ? new Date(validatedData.windowStart) : null,
        windowEnd: validatedData.windowEnd ? new Date(validatedData.windowEnd) : null,
        eventDate: new Date(validatedData.eventDate),
        doorsTime: validatedData.doorsTime ? new Date(validatedData.doorsTime) : null,
        showTime: validatedData.showTime ? new Date(validatedData.showTime) : null,
        ticketPrice,
        serviceFee,
        minPledges: validatedData.minPledges,
        maxCapacity: validatedData.maxCapacity,
        pledgeDeadline: new Date(validatedData.pledgeDeadline),
        imageUrl: validatedData.imageUrl || null,
        status: "PROPOSED",
      },
      include: {
        band: true,
        venue: true,
      },
    });

    // Notify fans who have this band in their preferences
    try {
      await notifyMatchingFans(event.id);
    } catch (err) {
      console.error("Failed to notify matching fans:", err);
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
