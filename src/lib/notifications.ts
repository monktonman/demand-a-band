import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import {
  pledgeConfirmationEmail,
  eventConfirmedEmail,
  eventCancelledEmail,
  thresholdMetEmail,
  paymentFailedEmail,
} from "@/lib/email-templates";
import { formatDate, formatCurrencyDecimal } from "@/lib/utils";

type NotificationType =
  | "EVENT_CREATED"
  | "THRESHOLD_MET"
  | "EVENT_CONFIRMED"
  | "EVENT_CANCELLED"
  | "PAYMENT_FAILED"
  | "PLEDGE_REMINDER";

// Create in-app notification
export async function createNotification({
  userId,
  type,
  title,
  message,
  eventId,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      eventId,
    },
  });
}

// Send pledge confirmation (in-app + email)
export async function notifyPledgeConfirmed({
  userId,
  eventId,
  bandName,
  venueName,
  eventDate,
  totalAmount,
  quantity,
}: {
  userId: string;
  eventId: string;
  bandName: string;
  venueName: string;
  eventDate: Date;
  totalAmount: number;
  quantity: number;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user) return;

  // In-app notification
  await createNotification({
    userId,
    type: "EVENT_CREATED",
    title: "Pledge Confirmed",
    message: `Your pledge for ${bandName} at ${venueName} is confirmed. You'll be charged ${formatCurrencyDecimal(totalAmount)} if the show is confirmed.`,
    eventId,
  });

  // Email
  if (user.email) {
    const email = pledgeConfirmationEmail(
      user.name || "Fan",
      bandName,
      venueName,
      formatDate(eventDate),
      formatCurrencyDecimal(totalAmount),
      quantity
    );
    await sendEmail({ to: user.email, ...email });
  }
}

// Notify all pledgers when event is confirmed
export async function notifyEventConfirmed(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      band: true,
      venue: true,
      pledges: {
        where: { status: { in: ["ACTIVE", "CHARGED"] } },
        include: { user: true },
      },
    },
  });

  if (!event) return;

  for (const pledge of event.pledges) {
    // In-app notification
    await createNotification({
      userId: pledge.userId,
      type: "EVENT_CONFIRMED",
      title: "Show Confirmed! 🎉",
      message: `${event.band.name} at ${event.venue.name} is officially confirmed! Your payment of ${formatCurrencyDecimal(Number(pledge.totalAmount))} has been processed.`,
      eventId,
    });

    // Email
    if (pledge.user.email) {
      const email = eventConfirmedEmail(
        pledge.user.name || "Fan",
        event.band.name,
        event.venue.name,
        formatDate(event.eventDate),
        formatCurrencyDecimal(Number(pledge.totalAmount))
      );
      await sendEmail({ to: pledge.user.email, ...email });
    }
  }
}

// Notify all pledgers when event is cancelled
export async function notifyEventCancelled(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      band: true,
      venue: true,
      pledges: {
        include: { user: true },
      },
    },
  });

  if (!event) return;

  for (const pledge of event.pledges) {
    // In-app notification
    await createNotification({
      userId: pledge.userId,
      type: "EVENT_CANCELLED",
      title: "Show Cancelled",
      message: `Unfortunately, ${event.band.name} at ${event.venue.name} didn't reach the minimum pledges. No charges were made.`,
      eventId,
    });

    // Email
    if (pledge.user.email) {
      const email = eventCancelledEmail(
        pledge.user.name || "Fan",
        event.band.name,
        event.venue.name
      );
      await sendEmail({ to: pledge.user.email, ...email });
    }
  }
}

// Notify all pledgers when threshold is met
export async function notifyThresholdMet(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      band: true,
      venue: true,
      pledges: {
        where: { status: "ACTIVE" },
        include: { user: true },
      },
      _count: { select: { pledges: true } },
    },
  });

  if (!event) return;

  for (const pledge of event.pledges) {
    // In-app notification
    await createNotification({
      userId: pledge.userId,
      type: "THRESHOLD_MET",
      title: "Minimum Pledges Reached! 🔥",
      message: `${event.band.name} at ${event.venue.name} has reached ${event._count.pledges} pledges! We're working to confirm the show.`,
      eventId,
    });

    // Email
    if (pledge.user.email) {
      const email = thresholdMetEmail(
        pledge.user.name || "Fan",
        event.band.name,
        event.venue.name,
        event._count.pledges,
        event.minPledges
      );
      await sendEmail({ to: pledge.user.email, ...email });
    }
  }
}

// Notify user of payment failure
export async function notifyPaymentFailed({
  userId,
  eventId,
  bandName,
  venueName,
}: {
  userId: string;
  eventId: string;
  bandName: string;
  venueName: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user) return;

  await createNotification({
    userId,
    type: "PAYMENT_FAILED",
    title: "Payment Issue",
    message: `We had trouble processing your payment for ${bandName} at ${venueName}. Please update your payment method.`,
    eventId,
  });

  if (user.email) {
    const email = paymentFailedEmail(
      user.name || "Fan",
      bandName,
      venueName
    );
    await sendEmail({ to: user.email, ...email });
  }
}
