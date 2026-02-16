// Email templates for DAB notifications
// Simple HTML templates — can be upgraded to React Email later

const BRAND_COLOR = "#ea580c"; // orange-600
const BRAND_BG = "#fff7ed"; // orange-50

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
    .card { background: white; border-radius: 12px; padding: 32px; border: 1px solid #e4e4e7; }
    .logo { color: ${BRAND_COLOR}; font-size: 20px; font-weight: 700; margin-bottom: 24px; }
    .logo span { color: #18181b; }
    h1 { font-size: 22px; color: #18181b; margin: 0 0 8px 0; }
    p { color: #52525b; line-height: 1.6; margin: 8px 0; }
    .btn { display: inline-block; background: ${BRAND_COLOR}; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .highlight { background: ${BRAND_BG}; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .highlight strong { color: #18181b; }
    .footer { text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 24px; }
    .footer a { color: ${BRAND_COLOR}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Demand A <span>Band</span></div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Demand A Band. All rights reserved.</p>
      <p><a href="${process.env.NEXTAUTH_URL || "https://demanda.band"}">Visit Demand A Band</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to Demand A Band! 🎸",
    html: baseTemplate(`
      <h1>Welcome, ${name}!</h1>
      <p>You've joined the movement that puts the power of booking shows in the fans' hands.</p>
      <div class="highlight">
        <strong>Here's how it works:</strong>
        <p style="margin: 4px 0;">1. Tell us which bands you want to see</p>
        <p style="margin: 4px 0;">2. Pledge when a show is proposed</p>
        <p style="margin: 4px 0;">3. Only pay if enough fans commit</p>
      </div>
      <p>Start by setting up your preferences — we'll use them to find shows you'll love.</p>
      <a href="${process.env.NEXTAUTH_URL || ""}/onboarding" class="btn">Set Up Preferences</a>
    `),
  };
}

export function pledgeConfirmationEmail(
  name: string,
  bandName: string,
  venueName: string,
  eventDate: string,
  totalAmount: string,
  quantity: number
): { subject: string; html: string } {
  return {
    subject: `Pledge confirmed: ${bandName} at ${venueName}`,
    html: baseTemplate(`
      <h1>Pledge Confirmed!</h1>
      <p>Hey ${name}, your pledge is locked in. You'll only be charged if the show reaches its minimum pledges and is confirmed.</p>
      <div class="highlight">
        <p style="margin: 4px 0;"><strong>${bandName}</strong></p>
        <p style="margin: 4px 0;">📍 ${venueName}</p>
        <p style="margin: 4px 0;">📅 ${eventDate}</p>
        <p style="margin: 4px 0;">🎫 ${quantity} ticket${quantity > 1 ? "s" : ""} — ${totalAmount}</p>
      </div>
      <p>Share this show with friends to help it reach the minimum!</p>
      <a href="${process.env.NEXTAUTH_URL || ""}/dashboard" class="btn">View My Pledges</a>
    `),
  };
}

export function eventConfirmedEmail(
  name: string,
  bandName: string,
  venueName: string,
  eventDate: string,
  totalAmount: string
): { subject: string; html: string } {
  return {
    subject: `It's happening! ${bandName} at ${venueName} is confirmed 🎉`,
    html: baseTemplate(`
      <h1>The Show Is On! 🎉</h1>
      <p>Great news, ${name}! Enough fans pledged and <strong>${bandName} at ${venueName}</strong> is officially confirmed.</p>
      <div class="highlight">
        <p style="margin: 4px 0;"><strong>${bandName}</strong></p>
        <p style="margin: 4px 0;">📍 ${venueName}</p>
        <p style="margin: 4px 0;">📅 ${eventDate}</p>
        <p style="margin: 4px 0;">💳 ${totalAmount} has been charged to your card</p>
      </div>
      <p>We'll send you more details as the show date approaches.</p>
      <a href="${process.env.NEXTAUTH_URL || ""}/dashboard" class="btn">View Details</a>
    `),
  };
}

export function eventCancelledEmail(
  name: string,
  bandName: string,
  venueName: string
): { subject: string; html: string } {
  return {
    subject: `Update: ${bandName} at ${venueName} didn't reach its minimum`,
    html: baseTemplate(`
      <h1>Show Update</h1>
      <p>Hey ${name}, unfortunately <strong>${bandName} at ${venueName}</strong> didn't reach the minimum number of pledges and has been cancelled.</p>
      <p><strong>No charges were made to your card.</strong></p>
      <p>Don't worry — we'll keep looking for ways to make it happen. In the meantime, check out other upcoming shows.</p>
      <a href="${process.env.NEXTAUTH_URL || ""}/events" class="btn">Browse Events</a>
    `),
  };
}

export function thresholdMetEmail(
  name: string,
  bandName: string,
  venueName: string,
  pledgeCount: number,
  minPledges: number
): { subject: string; html: string } {
  return {
    subject: `${bandName} hit the minimum! Just waiting for confirmation 🔥`,
    html: baseTemplate(`
      <h1>Threshold Met! 🔥</h1>
      <p>Hey ${name}, <strong>${bandName} at ${venueName}</strong> has reached ${pledgeCount} pledges (minimum was ${minPledges})!</p>
      <p>We're now working with the venue and artist to confirm the show. We'll let you know as soon as it's official.</p>
      <a href="${process.env.NEXTAUTH_URL || ""}/dashboard" class="btn">View Status</a>
    `),
  };
}

export function newEventMatchEmail(
  name: string,
  bandName: string,
  venueName: string,
  venueCity: string,
  eventDate: string,
  ticketPrice: string,
  eventSlug: string
): { subject: string; html: string } {
  return {
    subject: `${bandName} is coming to ${venueCity}! 🎶`,
    html: baseTemplate(`
      <h1>A Show You'll Love</h1>
      <p>Hey ${name}, great news — <strong>${bandName}</strong> is one of your favorites, and a show just dropped!</p>
      <div class="highlight">
        <p style="margin: 4px 0;"><strong>${bandName}</strong></p>
        <p style="margin: 4px 0;">📍 ${venueName} — ${venueCity}</p>
        <p style="margin: 4px 0;">📅 ${eventDate}</p>
        <p style="margin: 4px 0;">🎫 Tickets from ${ticketPrice}</p>
      </div>
      <p>Pledge now to lock in your spot. You'll only be charged if enough fans commit and the show is confirmed.</p>
      <a href="${process.env.NEXTAUTH_URL || ""}/events/${eventSlug}" class="btn">Pledge Now</a>
      <p style="color: #a1a1aa; font-size: 12px; margin-top: 16px;">You're receiving this because ${bandName} is in your preferences on Demand A Band.</p>
    `),
  };
}

export function ticketEmail(
  name: string,
  bandName: string,
  venueName: string,
  eventDate: string,
  doorsTime: string | null,
  showTime: string | null,
  tickets: { ticketCode: string; qrDataUri: string }[]
): { subject: string; html: string } {
  const ticketCount = tickets.length;
  const timeInfo = [
    doorsTime ? `🚪 Doors: ${doorsTime}` : null,
    showTime ? `🎵 Show: ${showTime}` : null,
  ].filter(Boolean).join("<br>");

  const ticketBlocks = tickets
    .map(
      (ticket, i) => `
      <div style="background: ${BRAND_BG}; border-radius: 12px; padding: 20px; margin: 16px 0; text-align: center; border: 2px dashed ${BRAND_COLOR};">
        <p style="font-size: 12px; color: #71717a; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
          Ticket ${ticketCount > 1 ? `${i + 1} of ${ticketCount}` : ""}
        </p>
        <img src="${ticket.qrDataUri}" alt="QR Code" width="200" height="200" style="display: block; margin: 0 auto 12px;" />
        <p style="font-family: monospace; font-size: 18px; font-weight: 700; color: #18181b; margin: 0; letter-spacing: 2px;">
          ${ticket.ticketCode}
        </p>
      </div>`
    )
    .join("");

  return {
    subject: `Your ticket${ticketCount > 1 ? "s" : ""} for ${bandName} at ${venueName} 🎫`,
    html: baseTemplate(`
      <h1>Your Ticket${ticketCount > 1 ? "s Are" : " Is"} Ready! 🎫</h1>
      <p>Hey ${name}, you're going to see <strong>${bandName}</strong>! Show ${ticketCount > 1 ? "these QR codes" : "this QR code"} at the door for entry.</p>
      <div class="highlight">
        <p style="margin: 4px 0;"><strong>${bandName}</strong></p>
        <p style="margin: 4px 0;">📍 ${venueName}</p>
        <p style="margin: 4px 0;">📅 ${eventDate}</p>
        ${timeInfo ? `<p style="margin: 4px 0;">${timeInfo}</p>` : ""}
        <p style="margin: 4px 0;">🎫 ${ticketCount} ticket${ticketCount > 1 ? "s" : ""}</p>
      </div>
      ${ticketBlocks}
      <p style="text-align: center; color: #71717a; font-size: 13px; margin-top: 16px;">
        You can also view your tickets anytime in your account.
      </p>
      <a href="${process.env.NEXTAUTH_URL || ""}/my-events" class="btn">View My Tickets</a>
    `),
  };
}

export function paymentFailedEmail(
  name: string,
  bandName: string,
  venueName: string
): { subject: string; html: string } {
  return {
    subject: `Action needed: Payment issue for ${bandName}`,
    html: baseTemplate(`
      <h1>Payment Issue</h1>
      <p>Hey ${name}, we had trouble processing your payment for <strong>${bandName} at ${venueName}</strong>.</p>
      <p>Please update your payment method to keep your pledge active.</p>
      <a href="${process.env.NEXTAUTH_URL || ""}/dashboard" class="btn">Update Payment</a>
      <p style="color: #a1a1aa; font-size: 12px;">If this issue isn't resolved, your pledge may be cancelled.</p>
    `),
  };
}
