import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { sendEmailWithLog } from "@/lib/resend";

// Helper to pause execution for a given number of milliseconds
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch unique recipient emails for a given segment
async function getSegmentRecipients(
  segmentType: string,
  segmentValue?: string
): Promise<string[]> {
  let recipients: { email: string }[] = [];

  switch (segmentType) {
    case "genre": {
      if (!segmentValue) return [];
      const genrePrefs = await prisma.userGenrePreference.findMany({
        where: { genre: segmentValue },
        select: {
          user: {
            select: { email: true },
          },
        },
        distinct: ["userId"],
      });
      recipients = genrePrefs.map((p) => ({ email: p.user.email }));
      break;
    }

    case "band": {
      if (!segmentValue) return [];
      const bandPrefs = await prisma.userBandPreference.findMany({
        where: { bandId: segmentValue },
        select: {
          user: {
            select: { email: true },
          },
        },
        distinct: ["userId"],
      });
      recipients = bandPrefs.map((p) => ({ email: p.user.email }));
      break;
    }

    case "event": {
      if (!segmentValue) return [];
      const pledges = await prisma.pledge.findMany({
        where: { eventId: segmentValue },
        select: {
          user: {
            select: { email: true },
          },
        },
        distinct: ["userId"],
      });
      recipients = pledges.map((p) => ({ email: p.user.email }));
      break;
    }

    case "all": {
      const fans = await prisma.user.findMany({
        where: { role: "FAN" },
        select: { email: true },
      });
      recipients = fans.map((u) => ({ email: u.email }));
      break;
    }

    default:
      return [];
  }

  // Deduplicate by email
  return [...new Set(recipients.map((r) => r.email))];
}

// POST /api/admin/emails/broadcast — Send broadcast email to a segment
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { segmentType, segmentValue, subject, html, confirmed } = body as {
      segmentType?: string;
      segmentValue?: string;
      subject?: string;
      html?: string;
      confirmed?: boolean;
    };

    if (
      !segmentType ||
      !["genre", "band", "event", "all"].includes(segmentType)
    ) {
      return NextResponse.json(
        {
          error:
            'Missing or invalid "segmentType". Must be one of: genre, band, event, all',
        },
        { status: 400 }
      );
    }

    if (segmentType !== "all" && !segmentValue) {
      return NextResponse.json(
        {
          error:
            '"segmentValue" is required for genre, band, and event segments',
        },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'subject' field" },
        { status: 400 }
      );
    }

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'html' field" },
        { status: 400 }
      );
    }

    const recipients = await getSegmentRecipients(segmentType, segmentValue);

    // Dry run — return count only
    if (!confirmed) {
      return NextResponse.json({
        dryRun: true,
        recipientCount: recipients.length,
      });
    }

    // Confirmed send — send in batches of 10 with 1 second delay between batches
    let sent = 0;
    let failed = 0;
    const batchSize = 10;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((to) =>
          sendEmailWithLog({
            to,
            subject,
            html,
            templateType: "broadcast",
            sentBy: session.user.email || undefined,
            metadata: {
              segmentType,
              segmentValue: segmentValue || null,
              broadcastBatch: Math.floor(i / batchSize) + 1,
            },
          })
        )
      );

      for (const result of results) {
        if (
          result.status === "fulfilled" &&
          result.value !== null
        ) {
          sent++;
        } else {
          failed++;
        }
      }

      // Delay between batches (skip delay after the last batch)
      if (i + batchSize < recipients.length) {
        await sleep(1000);
      }
    }

    return NextResponse.json({
      sent,
      failed,
      total: recipients.length,
    });
  } catch (error) {
    console.error("[Admin Emails] Broadcast error:", error);
    return NextResponse.json(
      { error: "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
