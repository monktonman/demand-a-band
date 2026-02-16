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
  ticketEmail,
} from "@/lib/email-templates";
import {
  pledgeConfirmationSms,
  eventConfirmedSms,
  eventCancelledSms,
  thresholdMetSms,
  newEventMatchSms,
  paymentFailedSms,
  ticketReadySms,
} from "@/lib/sms-templates";
import { formatDate, formatTime, formatCurrency, formatCurrencyDecimal } from "@/lib/utils";
import { generateQrDataUri } from "@/lib/tickets";

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

// Notify fans who have this band OR matching genres in their preferences about a new event
export async function notifyMatchingFans(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      band: true,
      venue: true,
    },
  });

  if (!event) return;

  const userSelect = { id: true, name: true, email: true, phone: true, smsOptIn: true };

  // Find users who have this specific band in their preferences
  const bandMatches = await prisma.userBandPreference.findMany({
    where: { bandId: event.bandId },
    include: { user: { select: userSelect } },
  });

  // Find users whose genre preferences overlap with this band's genres
  const bandGenres = event.band.genres || [];
  let genreMatches: { user: { id: string; name: string | null; email: string; phone: string | null; smsOptIn: boolean } }[] = [];

  if (bandGenres.length > 0) {
    genreMatches = await prisma.userGenrePreference.findMany({
      where: { genre: { in: bandGenres } },
      include: { user: { select: userSelect } },
    });
  }

  // Deduplicate users — band match users shouldn't also get a genre match notification
  const bandMatchUserIds = new Set(bandMatches.map((m) => m.user.id));
  const uniqueGenreUsers = genreMatches.filter(
    (m) => !bandMatchUserIds.has(m.user.id)
  );
  // Also deduplicate genre matches (a user may match multiple genres)
  const seenGenreUserIds = new Set<string>();
  const dedupedGenreUsers = uniqueGenreUsers.filter((m) => {
    if (seenGenreUserIds.has(m.user.id)) return false;
    seenGenreUserIds.add(m.user.id);
    return true;
  });

  const totalNotified = bandMatches.length + dedupedGenreUsers.length;
  if (totalNotified === 0) return;

  const ticketPrice = formatCurrency(Number(event.ticketPrice));
  const eventDate = formatDate(event.eventDate);

  // Notify band-preference matches (stronger match — "one of your favorites")
  for (const pref of bandMatches) {
    await createNotification({
      userId: pref.user.id,
      type: "EVENT_CREATED",
      title: `${event.band.name} show just dropped! 🎶`,
      message: `${event.band.name} at ${event.venue.name} on ${eventDate}. Tickets from ${ticketPrice}. Pledge now!`,
      eventId,
    });

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

    await maybeSendSms(
      pref.user,
      newEventMatchSms(event.band.name, event.venue.name, eventDate, ticketPrice, event.slug)
    );
  }

  // Notify genre-preference matches (discovery — "based on your genres")
  for (const match of dedupedGenreUsers) {
    const matchingGenres = bandGenres.join(", ");
    await createNotification({
      userId: match.user.id,
      type: "EVENT_CREATED",
      title: `New ${matchingGenres} show near you! 🎶`,
      message: `${event.band.name} at ${event.venue.name} on ${eventDate}. Matches your genre preferences. Tickets from ${ticketPrice}.`,
      eventId,
    });

    if (match.user.email) {
      const email = newEventMatchEmail(
        match.user.name || "Fan",
        event.band.name,
        event.venue.name,
        `${event.venue.city}, ${event.venue.state}`,
        eventDate,
        ticketPrice,
        event.slug
      );
      await sendEmail({ to: match.user.email, ...email });
    }

    await maybeSendSms(
      match.user,
      newEventMatchSms(event.band.name, event.venue.name, eventDate, ticketPrice, event.slug)
    );
  }

  console.log(`[Notify] Sent new event notifications to ${totalNotified} fans (${bandMatches.length} band + ${dedupedGenreUsers.length} genre) for ${event.band.name}`);
}

// Send ticket emails with QR codes for a charged pledge
export async function sendTicketEmails(pledgeId: string) {
  const pledge = await prisma.pledge.findUnique({
    where: { id: pledgeId },
    include: {
      user: { select: { name: true, email: true, phone: true, smsOptIn: true } },
      event: {
        include: {
          band: true,
          venue: true,
        },
      },
      tickets: true,
    },
  });

  if (!pledge || pledge.tickets.length === 0) {
    console.log(`[Tickets] No pledge or tickets found for ${pledgeId}`);
    return;
  }

  const formattedDate = formatDate(pledge.event.eventDate);
  const doorsTime = pledge.event.doorsTime ? formatTime(pledge.event.doorsTime) : null;
  const showTime = pledge.event.showTime ? formatTime(pledge.event.showTime) : null;

  // Generate QR code data URIs for each ticket
  const ticketsWithQr = await Promise.all(
    pledge.tickets.map(async (ticket) => ({
      ticketCode: ticket.ticketCode,
      qrDataUri: await generateQrDataUri(ticket.ticketCode),
    }))
  );

  // Send email with embedded QR codes
  if (pledge.user.email) {
    const email = ticketEmail(
      pledge.user.name || "Fan",
      pledge.event.band.name,
      pledge.event.venue.name,
      formattedDate,
      doorsTime,
      showTime,
      ticketsWithQr
    );
    await sendEmail({ to: pledge.user.email, ...email });
    console.log(`[Tickets] Sent ticket email to ${pledge.user.email} for ${pledge.event.band.name}`);
  }

  // Send SMS notification
  await maybeSendSms(
    pledge.user,
    ticketReadySms(pledge.event.band.name, pledge.event.venue.name, pledge.tickets.length)
  );
}
