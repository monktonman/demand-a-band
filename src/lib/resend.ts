import { Resend } from "resend";

// Only create Resend client if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "Demand A Band <noreply@demanda.band>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

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
