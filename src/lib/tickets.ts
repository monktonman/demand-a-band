import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

const BASE_URL = process.env.NEXTAUTH_URL || "https://demanda.band";

// Characters for ticket codes (uppercase alphanumeric, excluding confusing chars like 0/O, 1/I/L)
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generate a unique 12-character ticket code formatted as DAB-XXXX-XXXX
 */
export function generateTicketCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `DAB-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

/**
 * Generate a QR code as a base64 PNG data URI (for embedding in emails)
 */
export async function generateQrDataUri(ticketCode: string): Promise<string> {
  const url = `${BASE_URL}/check-in/verify?code=${ticketCode}`;
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#18181b",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate a QR code as SVG string (for rendering on ticket pages)
 */
export async function generateQrSvg(ticketCode: string): Promise<string> {
  const url = `${BASE_URL}/check-in/verify?code=${ticketCode}`;
  return QRCode.toString(url, {
    type: "svg",
    width: 300,
    margin: 2,
    color: {
      dark: "#18181b",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate tickets for a pledge (one ticket per quantity unit).
 * Idempotent — will not create duplicates if tickets already exist.
 */
export async function generateTicketsForPledge(pledgeId: string) {
  // Check if tickets already exist for this pledge
  const existingTickets = await prisma.ticket.findMany({
    where: { pledgeId },
  });

  if (existingTickets.length > 0) {
    console.log(`[Tickets] Tickets already exist for pledge ${pledgeId}, skipping generation`);
    return existingTickets;
  }

  // Fetch the pledge to get quantity, eventId, userId
  const pledge = await prisma.pledge.findUnique({
    where: { id: pledgeId },
    select: {
      id: true,
      quantity: true,
      eventId: true,
      userId: true,
      status: true,
    },
  });

  if (!pledge) {
    throw new Error(`Pledge ${pledgeId} not found`);
  }

  if (pledge.status !== "CHARGED") {
    console.log(`[Tickets] Pledge ${pledgeId} is not CHARGED (status: ${pledge.status}), skipping`);
    return [];
  }

  // Generate unique ticket codes with collision detection
  const tickets = [];
  for (let i = 0; i < pledge.quantity; i++) {
    let ticketCode: string;
    let attempts = 0;

    // Retry if code collision (extremely unlikely but safe)
    do {
      ticketCode = generateTicketCode();
      const existing = await prisma.ticket.findUnique({
        where: { ticketCode },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error("Failed to generate unique ticket code after 10 attempts");
    }

    const qrData = `${BASE_URL}/check-in/verify?code=${ticketCode}`;

    const ticket = await prisma.ticket.create({
      data: {
        pledgeId: pledge.id,
        eventId: pledge.eventId,
        userId: pledge.userId,
        ticketCode,
        qrData,
      },
    });

    tickets.push(ticket);
  }

  console.log(`[Tickets] Generated ${tickets.length} tickets for pledge ${pledgeId}`);
  return tickets;
}
