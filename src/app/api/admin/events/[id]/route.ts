import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole, isOperatorForVenue } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { createPaymentIntent } from "@/lib/stripe-helpers";
import { calculateServiceFee } from "@/lib/utils";
import {
  notifyEventConfirmed,
  notifyEventCancelled,
  notifyPaymentFailed,
} from "@/lib/notifications";
import { generateTicketsForPledge } from "@/lib/tickets";
import { sendTicketEmails } from "@/lib/notifications";

// GET: Fetch single event (admin or operator)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      band: { select: { id: true, name: true, genres: true } },
      venue: { select: { id: true, name: true, city: true, state: true, capacity: true } },
      pledges: {
        select: {
          id: true,
          quantity: true,
          totalAmount: true,
          status: true,
          chargedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { pledges: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!isOperatorForVenue(session, event.venue.id)) {
    return NextResponse.json({ error: "You do not manage this venue" }, { status: 403 });
  }

  // Compute actual ticket count from quantities
  const ticketCount = event.pledges
    .filter((p) => p.status === "ACTIVE" || p.status === "CHARGED")
    .reduce((sum, p) => sum + p.quantity, 0);

  return NextResponse.json({ event: { ...event, ticketCount } });
}

// PUT: Update event fields (admin or operator, only PROPOSED or THRESHOLD_MET)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { status: true, venueId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!isOperatorForVenue(session, event.venueId)) {
      return NextResponse.json({ error: "You do not manage this venue" }, { status: 403 });
    }

    if (event.status === "CONFIRMED" || event.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot edit confirmed or completed events" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    // Editable fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.eventDate !== undefined) updateData.eventDate = new Date(body.eventDate);
    if (body.doorsTime !== undefined) updateData.doorsTime = body.doorsTime ? new Date(body.doorsTime) : null;
    if (body.showTime !== undefined) updateData.showTime = body.showTime ? new Date(body.showTime) : null;
    if (body.pledgeDeadline !== undefined) updateData.pledgeDeadline = new Date(body.pledgeDeadline);
    if (body.ticketPrice !== undefined) {
      updateData.ticketPrice = body.ticketPrice;
      updateData.serviceFee = calculateServiceFee(body.ticketPrice);
    }
    if (body.minPledges !== undefined) updateData.minPledges = body.minPledges;
    if (body.maxCapacity !== undefined) updateData.maxCapacity = body.maxCapacity;

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        band: { select: { id: true, name: true } },
        venue: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ event: updated });
  } catch (error) {
    console.error("Event edit error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// PATCH: Update event status (admin or operator)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { action } = await req.json();

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        band: true,
        venue: true,
        pledges: {
          where: { status: "ACTIVE" },
          include: { user: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (!isOperatorForVenue(session, event.venue.id)) {
      return NextResponse.json({ error: "You do not manage this venue" }, { status: 403 });
    }

    if (action === "confirm") {
      // Confirm the event and charge all active pledges
      if (event.status !== "THRESHOLD_MET" && event.status !== "PROPOSED") {
        return NextResponse.json(
          { error: "Event cannot be confirmed in its current state" },
          { status: 400 }
        );
      }

      // Process payments for all active pledges
      const results: { pledgeId: string; success: boolean; error?: string }[] = [];

      for (const pledge of event.pledges) {
        try {
          const paymentIntent = await createPaymentIntent(
            pledge.userId,
            Number(pledge.totalAmount),
            event.id,
            pledge.id,
            pledge.stripePaymentMethodId || undefined
          );

          // Update pledge with payment intent
          await prisma.pledge.update({
            where: { id: pledge.id },
            data: {
              stripePaymentIntentId: paymentIntent.id,
              status:
                paymentIntent.status === "succeeded" ? "CHARGED" : "ACTIVE",
              chargedAt:
                paymentIntent.status === "succeeded" ? new Date() : null,
            },
          });

          // Generate tickets if payment succeeded immediately
          if (paymentIntent.status === "succeeded") {
            try {
              const tickets = await generateTicketsForPledge(pledge.id);
              if (tickets.length > 0) {
                await sendTicketEmails(pledge.id);
              }
            } catch (ticketErr) {
              console.error(`Failed to generate tickets/send emails for pledge ${pledge.id}:`, ticketErr);
            }
          }

          results.push({ pledgeId: pledge.id, success: true });
        } catch (err) {
          console.error(
            `Payment failed for pledge ${pledge.id}:`,
            err
          );

          await prisma.pledge.update({
            where: { id: pledge.id },
            data: { status: "PAYMENT_FAILED" },
          });

          results.push({
            pledgeId: pledge.id,
            success: false,
            error: err instanceof Error ? err.message : "Payment failed",
          });
        }
      }

      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      // Only confirm if at least one payment succeeded (or no pledges to charge)
      if (succeeded === 0 && event.pledges.length > 0) {
        return NextResponse.json(
          {
            error:
              "All payment charges failed. Event was not confirmed.",
            payments: {
              total: results.length,
              succeeded,
              failed,
              details: results,
            },
          },
          { status: 422 }
        );
      }

      // At least one payment succeeded — confirm the event
      await prisma.event.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      // Send notifications to all pledgers
      try {
        await notifyEventConfirmed(id);
      } catch (err) {
        console.error("Failed to send event confirmed notifications:", err);
      }

      // Notify users with failed payments
      for (const result of results.filter((r) => !r.success)) {
        const pledge = event.pledges.find((p) => p.id === result.pledgeId);
        if (pledge) {
          try {
            await notifyPaymentFailed({
              userId: pledge.userId,
              eventId: id,
              bandName: event.band.name,
              venueName: event.venue.name,
            });
          } catch (err) {
            console.error(`Failed to send payment failed notification for pledge ${pledge.id}:`, err);
          }
        }
      }

      return NextResponse.json({
        event: { id, status: "CONFIRMED" },
        payments: {
          total: results.length,
          succeeded,
          failed,
          details: results,
        },
      });
    }

    if (action === "cancel") {
      // Cancel the event and all active pledges
      if (event.status === "COMPLETED") {
        return NextResponse.json(
          { error: "Completed events cannot be cancelled" },
          { status: 400 }
        );
      }

      // Cancel all active pledges
      await prisma.pledge.updateMany({
        where: {
          eventId: id,
          status: "ACTIVE",
        },
        data: { status: "CANCELLED" },
      });

      // Update event status
      await prisma.event.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      // Send cancellation notifications
      try {
        await notifyEventCancelled(id);
      } catch (err) {
        console.error("Failed to send event cancelled notifications:", err);
      }

      return NextResponse.json({
        event: { id, status: "CANCELLED" },
        cancelledPledges: event.pledges.length,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'confirm' or 'cancel'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE: Remove event (admin or operator, only PROPOSED or CANCELLED)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { status: true, venueId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!isOperatorForVenue(session, event.venueId)) {
      return NextResponse.json({ error: "You do not manage this venue" }, { status: 403 });
    }

    if (event.status === "CONFIRMED" || event.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot delete confirmed or completed events" },
        { status: 400 }
      );
    }

    // Delete pledges first, then the event
    await prisma.$transaction([
      prisma.pledge.deleteMany({ where: { eventId: id } }),
      prisma.notification.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
