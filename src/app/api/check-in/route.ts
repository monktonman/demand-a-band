import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Check in a ticket by ticket code
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ticketCode, eventId } = await req.json();

    if (!ticketCode || !eventId) {
      return NextResponse.json(
        { error: "ticketCode and eventId are required" },
        { status: 400 }
      );
    }

    // Find the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode: ticketCode.toUpperCase().trim() },
      include: {
        user: { select: { name: true, email: true } },
        pledge: { select: { quantity: true } },
        event: {
          select: {
            id: true,
            title: true,
            band: { select: { name: true } },
            venue: { select: { name: true } },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid ticket code",
          message: "No ticket found with this code",
        },
        { status: 404 }
      );
    }

    // Verify the ticket belongs to the correct event
    if (ticket.eventId !== eventId) {
      return NextResponse.json(
        {
          valid: false,
          error: "Wrong event",
          message: "This ticket is for a different event",
        },
        { status: 400 }
      );
    }

    // Check if already checked in
    if (ticket.checkedInAt) {
      return NextResponse.json({
        valid: false,
        alreadyCheckedIn: true,
        message: "Already checked in",
        checkedInAt: ticket.checkedInAt,
        fanName: ticket.user.name || "Fan",
        ticketCode: ticket.ticketCode,
      });
    }

    // Perform check-in
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        checkedInAt: new Date(),
        checkedInBy: session.user.id,
      },
    });

    // Count how many of this user's tickets for this event are checked in
    const userTicketsForEvent = await prisma.ticket.findMany({
      where: {
        userId: ticket.userId,
        eventId: ticket.eventId,
      },
      select: { checkedInAt: true },
    });
    const checkedInCount = userTicketsForEvent.filter(
      (t) => t.checkedInAt
    ).length;

    return NextResponse.json({
      valid: true,
      message: "Checked in successfully",
      fanName: ticket.user.name || "Fan",
      fanEmail: ticket.user.email,
      ticketCode: ticket.ticketCode,
      checkedInAt: updatedTicket.checkedInAt,
      ticketNumber: checkedInCount,
      totalTickets: userTicketsForEvent.length,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Check-in failed" },
      { status: 500 }
    );
  }
}

// GET: Get check-in stats and guest list for an event
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "eventId is required" },
      { status: 400 }
    );
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        eventDate: true,
        band: { select: { name: true } },
        venue: { select: { name: true, city: true, state: true } },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const tickets = await prisma.ticket.findMany({
      where: { eventId },
      include: {
        user: { select: { name: true, email: true } },
        pledge: { select: { quantity: true, totalAmount: true } },
      },
      orderBy: [
        { user: { name: "asc" } },
        { createdAt: "asc" },
      ],
    });

    const totalTickets = tickets.length;
    const checkedInCount = tickets.filter((t) => t.checkedInAt).length;

    return NextResponse.json({
      event,
      stats: {
        totalTickets,
        checkedIn: checkedInCount,
        remaining: totalTickets - checkedInCount,
      },
      tickets: tickets.map((t) => ({
        id: t.id,
        ticketCode: t.ticketCode,
        fanName: t.user.name || "Unknown",
        fanEmail: t.user.email,
        checkedInAt: t.checkedInAt,
        checkedInBy: t.checkedInBy,
        pledgeQuantity: t.pledge.quantity,
      })),
    });
  } catch (error) {
    console.error("Guest list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guest list" },
      { status: 500 }
    );
  }
}
