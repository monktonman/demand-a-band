import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/resend";

// POST: Send a test email (admin only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to } = await req.json();
  const recipient = to || session.user.email;

  if (!recipient) {
    return NextResponse.json({ error: "No recipient email" }, { status: 400 });
  }

  const result = await sendEmail({
    to: recipient,
    subject: "Demand A Band — Test Email",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ea580c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Demand A Band</h1>
        </div>
        <div style="border: 1px solid #e4e4e7; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 12px;">Test Email</h2>
          <p style="color: #52525b;">
            If you're reading this, email delivery is working correctly.
          </p>
          <p style="color: #a1a1aa; font-size: 14px;">
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `,
  });

  if (result) {
    return NextResponse.json({
      success: true,
      message: `Test email sent to ${recipient}`,
      emailId: result.id,
    });
  }

  return NextResponse.json(
    {
      success: false,
      message: "Email send failed — check server logs for [Email] errors",
    },
    { status: 500 }
  );
}
