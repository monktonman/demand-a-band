import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { eventId, quantity = 1 } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Get the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { pledges: true } } },
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

    // Check capacity
    if (event._count.pledges + quantity > event.maxCapacity) {
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
      },
      include: {
        event: {
          include: { band: true, venue: true },
        },
      },
    });

    // Check if threshold is now met
    const totalPledges = event._count.pledges + quantity;
    if (totalPledges >= event.minPledges && event.status === "PROPOSED") {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: "THRESHOLD_MET" },
      });
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
