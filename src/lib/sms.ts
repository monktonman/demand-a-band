// SMS service using Twilio
// Falls back to console.log when no credentials are configured

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER; // e.g. "+1234567890"

let twilioClient: ReturnType<typeof createTwilioClient> | null = null;

function createTwilioClient() {
  // Dynamic import approach — Twilio SDK is heavy, only load when needed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require("twilio");
  return twilio(accountSid, authToken);
}

function getClient() {
  if (!accountSid || !authToken || !fromNumber) return null;
  if (!twilioClient) {
    twilioClient = createTwilioClient();
  }
  return twilioClient;
}

interface SendSmsOptions {
  to: string; // E.164 format: "+12125551234"
  body: string;
}

/**
 * Normalize a US phone number to E.164 format (+1XXXXXXXXXX)
 */
export function normalizePhone(phone: string): string {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, "");

  // If already has country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // 10-digit US number
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Return as-is with + prefix if nothing matches
  return `+${digits}`;
}

export async function sendSms({ to, body }: SendSmsOptions): Promise<string | null> {
  const client = getClient();

  if (!client) {
    console.log(`[SMS] Would send to ${to}: ${body.substring(0, 80)}...`);
    return null;
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    console.log(`[SMS] Sent to ${to}: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error("[SMS] Failed to send:", error);
    return null;
  }
}
