import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentIntent } from "@/lib/stripe-helpers";
import { calculateServiceFee } from "@/lib/utils";
import {
  notifyEventConfirmed,
  notifyEventCancelled,
  notifyPaymentFailed,
} from "@/lib/notifications";

// GET: Fetch single event (admin or operator)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      band: { select: { id: true, name: true, genres: true } },
      venue: { select: { id: true, name: true, city: true, state: true, capacity: true } },
      _count: { select: { pledges: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}

// PUT: Update event fields (admin or operator, only PROPOSED or THRESHOLD_MET)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { action } = await req.json();

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
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

      // Update event status
      await prisma.event.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      // Send notifications to all pledgers
      notifyEventConfirmed(id).catch(console.error);

      // Notify users with failed payments
      for (const result of results.filter((r) => !r.success)) {
        const pledge = event.pledges.find((p) => p.id === result.pledgeId);
        if (pledge) {
          notifyPaymentFailed({
            userId: pledge.userId,
            eventId: id,
            bandName: "the artist",
            venueName: "the venue",
          }).catch(console.error);
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
      notifyEventCancelled(id).catch(console.error);

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
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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
