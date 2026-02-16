import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { sendSms, normalizePhone } from "@/lib/sms";
import {
  pledgeConfirmationEmail,
  eventConfirmedEmail,
  eventCancelledEmail,
  thresholdMetEmail,
  paymentFailedEmail,
  newEventMatchEmail,
} from "@/lib/email-templates";
import {
  pledgeConfirmationSms,
  eventConfirmedSms,
  eventCancelledSms,
  thresholdMetSms,
  newEventMatchSms,
  paymentFailedSms,
} from "@/lib/sms-templates";
import { formatDate, formatCurrency, formatCurrencyDecimal } from "@/lib/utils";

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

// Helper to send SMS if user has phone + opted in
async function maybeSendSms(user: { phone?: string | null; smsOptIn?: boolean }, body: string) {
  if (user.phone && user.smsOptIn) {
    await sendSms({ to: normalizePhone(user.phone), body });
  }
}

// Send pledge confirmation (in-app + email + SMS)
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
    select: { name: true, email: true, phone: true, smsOptIn: true },
  });

  if (!user) return;

  const formattedDate = formatDate(eventDate);
  const formattedAmount = formatCurrencyDecimal(totalAmount);

  // In-app notification
  await createNotification({
    userId,
    type: "EVENT_CREATED",
    title: "Pledge Confirmed",
    message: `Your pledge for ${bandName} at ${venueName} is confirmed. You'll be charged ${formattedAmount} if the show is confirmed.`,
    eventId,
  });

  // Email
  if (user.email) {
    const email = pledgeConfirmationEmail(
      user.name || "Fan",
      bandName,
      venueName,
      formattedDate,
      formattedAmount,
      quantity
    );
    await sendEmail({ to: user.email, ...email });
  }

  // SMS
  await maybeSendSms(user, pledgeConfirmationSms(bandName, venueName, formattedDate, formattedAmount));
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

  const formattedDate = formatDate(event.eventDate);

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
        formattedDate,
        formatCurrencyDecimal(Number(pledge.totalAmount))
      );
      await sendEmail({ to: pledge.user.email, ...email });
    }

    // SMS
    await maybeSendSms(pledge.user, eventConfirmedSms(event.band.name, event.venue.name, formattedDate));
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

    // SMS
    await maybeSendSms(pledge.user, eventCancelledSms(event.band.name, event.venue.name));
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

    // SMS
    await maybeSendSms(pledge.user, thresholdMetSms(event.band.name, event.venue.name, event._count.pledges));
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
    select: { name: true, email: true, phone: true, smsOptIn: true },
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

  // SMS
  await maybeSendSms(user, paymentFailedSms(bandName, venueName));
}

// Notify fans who have this band in their preferences about a new event
export async function notifyMatchingFans(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      band: true,
      venue: true,
    },
  });

  if (!event) return;

  // Find all users who have this band in their preferences
  const matchingPrefs = await prisma.userBandPreference.findMany({
    where: { bandId: event.bandId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, smsOptIn: true } },
    },
  });

  if (matchingPrefs.length === 0) return;

  const ticketPrice = formatCurrency(Number(event.ticketPrice));
  const eventDate = formatDate(event.eventDate);

  for (const pref of matchingPrefs) {
    // In-app notification
    await createNotification({
      userId: pref.user.id,
      type: "EVENT_CREATED",
      title: `${event.band.name} show just dropped! 🎶`,
      message: `${event.band.name} at ${event.venue.name} on ${eventDate}. Tickets from ${ticketPrice}. Pledge now!`,
      eventId,
    });

    // Email
    if (pref.user.email) {
      const email = newEventMatchEmail(
        pref.user.name || "Fan",
        event.band.name,
        event.venue.name,
        `${event.venue.city}, ${event.venue.state}`,
        eventDate,
        ticketPrice,
        event.slug
      );
      await sendEmail({ to: pref.user.email, ...email });
    }

    // SMS
    await maybeSendSms(
      pref.user,
      newEventMatchSms(event.band.name, event.venue.name, eventDate, ticketPrice, event.slug)
    );
  }

  console.log(`[Notify] Sent new event notifications to ${matchingPrefs.length} fans for ${event.band.name}`);
}
