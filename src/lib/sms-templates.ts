// SMS message templates for DAB notifications
// Keep under 160 chars per message when possible (1 SMS segment)

const BASE_URL = process.env.NEXTAUTH_URL || "https://demanda.band";

export function pledgeConfirmationSms(
  bandName: string,
  venueName: string,
  eventDate: string,
  totalAmount: string
): string {
  return `DAB: Your pledge for ${bandName} at ${venueName} on ${eventDate} (${totalAmount}) is confirmed! You'll only be charged if the show is confirmed.`;
}

export function eventConfirmedSms(
  bandName: string,
  venueName: string,
  eventDate: string
): string {
  return `DAB: It's happening! 🎉 ${bandName} at ${venueName} on ${eventDate} is confirmed. Your card has been charged. See details: ${BASE_URL}/dashboard`;
}

export function eventCancelledSms(
  bandName: string,
  venueName: string
): string {
  return `DAB: ${bandName} at ${venueName} didn't reach the minimum pledges and has been cancelled. No charges were made to your card.`;
}

export function thresholdMetSms(
  bandName: string,
  venueName: string,
  pledgeCount: number
): string {
  return `DAB: 🔥 ${bandName} at ${venueName} hit ${pledgeCount} pledges! We're working to confirm the show. Stay tuned!`;
}

export function newEventMatchSms(
  bandName: string,
  venueName: string,
  eventDate: string,
  ticketPrice: string,
  eventSlug: string
): string {
  return `DAB: ${bandName} at ${venueName} on ${eventDate}! Tickets from ${ticketPrice}. Pledge now: ${BASE_URL}/events/${eventSlug}`;
}

export function ticketReadySms(
  bandName: string,
  venueName: string,
  ticketCount: number
): string {
  return `DAB: 🎫 Your ${ticketCount} ticket${ticketCount > 1 ? "s" : ""} for ${bandName} at ${venueName} ${ticketCount > 1 ? "are" : "is"} ready! View: ${BASE_URL}/my-events`;
}

export function paymentFailedSms(
  bandName: string,
  venueName: string
): string {
  return `DAB: Payment issue for ${bandName} at ${venueName}. Update your payment method to keep your pledge: ${BASE_URL}/dashboard`;
}
