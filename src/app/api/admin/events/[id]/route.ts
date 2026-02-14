import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentIntent } from "@/lib/stripe-helpers";

// PATCH: Update event status (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
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
