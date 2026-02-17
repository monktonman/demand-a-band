import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { EmailStatus } from "@prisma/client";

// Only create Resend client if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "Demand A Band <noreply@demanda.band>";

// Export for direct API access in admin routes
export { resend as resendClient };

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email via Resend. Returns { id } on success, null on failure.
 * This is the low-level function — prefer sendEmailWithLog() for tracked sends.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // Skip sending if no Resend client (no API key)
  if (!resend) {
    console.log(`[Email] No RESEND_API_KEY — would send to ${to}: ${subject}`);
    return null;
  }

  try {
    console.log(`[Email] Sending to ${to}: ${subject} (from: ${FROM_EMAIL})`);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[Email] Resend error for ${to}:`, JSON.stringify(error));
      return null;
    }

    console.log(`[Email] Sent successfully to ${to}, id: ${data?.id}`);
    return data;
  } catch (error) {
    console.error(`[Email] Exception sending to ${to}:`, error);
    return null;
  }
}

// ------------------------------------
// Tracked email sending with logging
// ------------------------------------

interface SendEmailWithLogOptions extends SendEmailOptions {
  templateType?: string;
  userId?: string;
  eventId?: string;
  metadata?: Record<string, unknown>;
  sentBy?: string;
}

/**
 * Send an email and log it to the EmailLog table for admin visibility.
 * Returns { id } on success, null on failure. Always creates a log entry.
 */
export async function sendEmailWithLog({
  to,
  subject,
  html,
  templateType,
  userId,
  eventId,
  metadata,
  sentBy,
}: SendEmailWithLogOptions) {
  const result = await sendEmail({ to, subject, html });

  // Log to database regardless of success/failure
  try {
    await prisma.emailLog.create({
      data: {
        resendId: result?.id || null,
        to,
        subject,
        templateType: templateType || "unknown",
        status: result ? "SENT" : "FAILED",
        userId: userId || null,
        eventId: eventId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        sentBy: sentBy || null,
        errorMessage: result ? null : "Send failed — check server logs",
      },
    });
  } catch (logErr) {
    console.error("[Email] Failed to create EmailLog entry:", logErr);
  }

  return result;
}

// ------------------------------------
// Email status sync from Resend API
// ------------------------------------

// Map Resend status strings to our EmailStatus enum
const RESEND_STATUS_MAP: Record<string, EmailStatus> = {
  queued: "QUEUED",
  sent: "SENT",
  delivered: "DELIVERED",
  delivery_delayed: "SENT",
  bounced: "BOUNCED",
  complained: "COMPLAINED",
};

/**
 * Sync an EmailLog's delivery status from the Resend API.
 * Returns the updated status or null if sync failed.
 */
export async function syncEmailStatus(
  emailLogId: string
): Promise<EmailStatus | null> {
  if (!resend) return null;

  const emailLog = await prisma.emailLog.findUnique({
    where: { id: emailLogId },
  });

  if (!emailLog?.resendId) return null;

  try {
    const { data, error } = await resend.emails.get(emailLog.resendId);

    if (error || !data) {
      console.error(
        `[Email] Failed to get status for ${emailLog.resendId}:`,
        error
      );
      return null;
    }

    // Map Resend's last_event to our status
    const resendStatus =
      (data as unknown as Record<string, unknown>).last_event as string | undefined;
    const mappedStatus: EmailStatus =
      RESEND_STATUS_MAP[resendStatus || ""] || "SENT";

    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: { status: mappedStatus },
    });

    return mappedStatus;
  } catch (err) {
    console.error(`[Email] Status sync failed for ${emailLogId}:`, err);
    return null;
  }
}
