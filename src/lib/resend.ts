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
    console.log(`[Email] Would send to ${to}: ${subject}`);
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    return null;
  }
}
