import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { generateTicketsForPledge } from "@/lib/tickets";
import { sendTicketEmails } from "@/lib/notifications";

// Disable body parsing for webhook verification
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const pledgeId = paymentIntent.metadata.pledgeId;

        if (pledgeId) {
          await prisma.pledge.update({
            where: { id: pledgeId },
            data: {
              status: "CHARGED",
              chargedAt: new Date(),
              stripePaymentIntentId: paymentIntent.id,
            },
          });
          console.log(`Pledge ${pledgeId} charged successfully`);

          // Generate tickets (idempotent — skips if already generated)
          generateTicketsForPledge(pledgeId)
            .then((tickets) => {
              if (tickets.length > 0) {
                sendTicketEmails(pledgeId).catch(console.error);
              }
            })
            .catch(console.error);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const pledgeId = paymentIntent.metadata.pledgeId;

        if (pledgeId) {
          await prisma.pledge.update({
            where: { id: pledgeId },
            data: {
              status: "PAYMENT_FAILED",
              stripePaymentIntentId: paymentIntent.id,
            },
          });
          console.log(`Pledge ${pledgeId} payment failed`);
        }
        break;
      }

      case "setup_intent.succeeded": {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        const userId = setupIntent.metadata?.userId;

        if (userId) {
          console.log(
            `SetupIntent succeeded for user ${userId}, payment method saved`
          );
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (paymentIntentId) {
          const pledge = await prisma.pledge.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });

          if (pledge) {
            await prisma.pledge.update({
              where: { id: pledge.id },
              data: {
                status: "REFUNDED",
                refundedAt: new Date(),
              },
            });
            console.log(`Pledge ${pledge.id} refunded`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
