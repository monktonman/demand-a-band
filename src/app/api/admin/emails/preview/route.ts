import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import {
  emailVerificationEmail,
  welcomeEmail,
  pledgeConfirmationEmail,
  eventConfirmedEmail,
  eventCancelledEmail,
  thresholdMetEmail,
  newEventMatchEmail,
  ticketEmail,
  paymentFailedEmail,
} from "@/lib/email-templates";

// Converts camelCase to Title Case (e.g., "pledgeConfirmation" -> "Pledge Confirmation")
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// Sample data generators for each template type
const SAMPLE_DATA: Record<string, () => { subject: string; html: string }> = {
  emailVerification: () =>
    emailVerificationEmail(
      "Jane Fan",
      "https://demanda.band/api/auth/verify-email?token=sample-token-123"
    ),
  welcome: () => welcomeEmail("Jane Fan"),
  pledgeConfirmation: () =>
    pledgeConfirmationEmail(
      "Jane Fan",
      "JJ Grey & Mofro",
      "The Caverns",
      "March 15, 2026",
      "$45.00",
      2
    ),
  eventConfirmed: () =>
    eventConfirmedEmail(
      "Jane Fan",
      "JJ Grey & Mofro",
      "The Caverns",
      "March 15, 2026",
      "$45.00"
    ),
  eventCancelled: () =>
    eventCancelledEmail("Jane Fan", "JJ Grey & Mofro", "The Caverns"),
  thresholdMet: () =>
    thresholdMetEmail("Jane Fan", "JJ Grey & Mofro", "The Caverns", 42, 30),
  newEventMatch: () =>
    newEventMatchEmail(
      "Jane Fan",
      "JJ Grey & Mofro",
      "The Caverns",
      "Nashville, TN",
      "March 15, 2026",
      "$35",
      "jj-grey-mofro-the-caverns"
    ),
  ticket: () =>
    ticketEmail(
      "Jane Fan",
      "JJ Grey & Mofro",
      "The Caverns",
      "March 15, 2026",
      "7:00 PM",
      "8:00 PM",
      [
        {
          ticketCode: "DAB-ABC123",
          qrDataUri:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
      ]
    ),
  paymentFailed: () =>
    paymentFailedEmail("Jane Fan", "JJ Grey & Mofro", "The Caverns"),
};

// GET /api/admin/emails/preview — List available template types
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    templates: Object.keys(SAMPLE_DATA).map((key) => ({
      type: key,
      label: formatLabel(key),
    })),
  });
}

// POST /api/admin/emails/preview — Render a template preview with sample data
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { templateType } = body as { templateType?: string };

    if (!templateType || typeof templateType !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'templateType' field" },
        { status: 400 }
      );
    }

    const generator = SAMPLE_DATA[templateType];

    if (!generator) {
      return NextResponse.json(
        {
          error: `Unknown template type: "${templateType}". Available types: ${Object.keys(SAMPLE_DATA).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const { subject, html } = generator();

    return NextResponse.json({
      subject,
      html,
      templateType,
    });
  } catch (error) {
    console.error("[Admin Emails] Preview error:", error);
    return NextResponse.json(
      { error: "Failed to generate template preview" },
      { status: 500 }
    );
  }
}
