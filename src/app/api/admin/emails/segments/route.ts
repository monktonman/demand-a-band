import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

// GET /api/admin/emails/segments — Get recipient count and sample for a segment
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const value = searchParams.get("value");

  if (!type || !["genre", "band", "event", "all"].includes(type)) {
    return NextResponse.json(
      {
        error:
          'Missing or invalid "type" parameter. Must be one of: genre, band, event, all',
      },
      { status: 400 }
    );
  }

  if (type !== "all" && !value) {
    return NextResponse.json(
      { error: '"value" parameter is required for genre, band, and event segments' },
      { status: 400 }
    );
  }

  try {
    let recipients: { email: string }[] = [];

    switch (type) {
      case "genre": {
        // Find users with a matching genre preference
        const genrePrefs = await prisma.userGenrePreference.findMany({
          where: { genre: value! },
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
        // Find users with a matching band preference
        const bandPrefs = await prisma.userBandPreference.findMany({
          where: { bandId: value! },
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
        // Find users who have pledged for this event
        const pledges = await prisma.pledge.findMany({
          where: { eventId: value! },
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
        // Find all FAN users with an email
        const fans = await prisma.user.findMany({
          where: { role: "FAN" },
          select: { email: true },
        });
        recipients = fans.map((u) => ({ email: u.email }));
        break;
      }
    }

    // Deduplicate by email
    const uniqueEmails = [...new Set(recipients.map((r) => r.email))];

    return NextResponse.json({
      segmentType: type,
      segmentValue: value || null,
      recipientCount: uniqueEmails.length,
      sampleRecipients: uniqueEmails.slice(0, 10),
    });
  } catch (error) {
    console.error("[Admin Emails] Segments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment data" },
      { status: 500 }
    );
  }
}
