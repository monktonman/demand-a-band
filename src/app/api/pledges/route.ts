import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyPledgeConfirmed, notifyThresholdMet } from "@/lib/notifications";

// GET: Get user's pledges
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pledges = await prisma.pledge.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        include: {
          band: true,
          venue: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pledges });
}

// POST: Create a new pledge
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { eventId, quantity = 1, paymentMethodId } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Get the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Validate event is open for pledges
    if (event.status !== "PROPOSED" && event.status !== "THRESHOLD_MET") {
      return NextResponse.json(
        { error: "This event is not accepting pledges" },
        { status: 400 }
      );
    }

    // Check if pledge deadline has passed
    if (new Date() > event.pledgeDeadline) {
      return NextResponse.json(
        { error: "The pledge deadline has passed" },
        { status: 400 }
      );
    }

    // Check if user already pledged
    const existingPledge = await prisma.pledge.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    if (existingPledge) {
      return NextResponse.json(
        { error: "You have already pledged for this event" },
        { status: 409 }
      );
    }

    // Get actual ticket count (sum of quantities, not row count)
    const ticketAggregate = await prisma.pledge.aggregate({
      where: {
        eventId,
        status: { in: ["ACTIVE", "CHARGED"] },
      },
      _sum: { quantity: true },
    });
    const currentTicketCount = ticketAggregate._sum.quantity || 0;

    // Check capacity using ticket quantities
    if (currentTicketCount + quantity > event.maxCapacity) {
      return NextResponse.json(
        { error: "Not enough capacity remaining" },
        { status: 400 }
      );
    }

    // Calculate amounts
    const ticketPrice = Number(event.ticketPrice);
    const serviceFee = Number(event.serviceFee);
    const totalAmount = (ticketPrice + serviceFee) * quantity;

    // Create the pledge
    const pledge = await prisma.pledge.create({
      data: {
        userId: session.user.id,
        eventId,
        quantity,
        totalAmount,
        status: "ACTIVE",
        stripePaymentMethodId: paymentMethodId || null,
      },
      include: {
        event: {
          include: { band: true, venue: true },
        },
      },
    });

    // Send pledge confirmation notification
    try {
      await notifyPledgeConfirmed({
        userId: session.user.id,
        eventId,
        bandName: pledge.event.band.name,
        venueName: pledge.event.venue.name,
        eventDate: pledge.event.eventDate,
        totalAmount,
        quantity,
      });
    } catch (err) {
      console.error("Failed to send pledge confirmation:", err);
    }

    // Check if threshold is now met (using ticket quantities)
    const totalTickets = currentTicketCount + quantity;
    if (totalTickets >= event.minPledges && event.status === "PROPOSED") {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: "THRESHOLD_MET" },
      });

      // Notify all pledgers that threshold was met
      try {
        await notifyThresholdMet(eventId);
      } catch (err) {
        console.error("Failed to notify threshold met:", err);
      }
    }

    return NextResponse.json({ pledge }, { status: 201 });
  } catch (error) {
    console.error("Create pledge error:", error);
    return NextResponse.json(
      { error: "Failed to create pledge" },
      { status: 500 }
    );
  }
}

// DELETE: Cancel a pledge
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pledgeId = searchParams.get("id");

  if (!pledgeId) {
    return NextResponse.json(
      { error: "Pledge ID is required" },
      { status: 400 }
    );
  }

  const pledge = await prisma.pledge.findUnique({
    where: { id: pledgeId },
    include: { event: true },
  });

  if (!pledge || pledge.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Pledge not found" },
      { status: 404 }
    );
  }

  if (pledge.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Only active pledges can be cancelled" },
      { status: 400 }
    );
  }

  await prisma.pledge.update({
    where: { id: pledgeId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true });
}
