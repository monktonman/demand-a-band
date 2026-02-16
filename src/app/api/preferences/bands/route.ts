import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/preferences/bands
 * Add a single band to the user's preferences.
 * Body: { bandId: string }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bandId } = await req.json();
    if (!bandId) {
      return NextResponse.json({ error: "bandId is required" }, { status: 400 });
    }

    // Check if band exists
    const band = await prisma.band.findUnique({
      where: { id: bandId },
      select: { id: true, name: true },
    });
    if (!band) {
      return NextResponse.json({ error: "Band not found" }, { status: 404 });
    }

    // Upsert — if preference already exists, just return success
    await prisma.userBandPreference.upsert({
      where: {
        userId_bandId: {
          userId: session.user.id,
          bandId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        bandId,
        maxTicketPrice: 50,
        priority: 99,
      },
    });

    return NextResponse.json({ success: true, bandName: band.name });
  } catch (error) {
    console.error("Error adding band preference:", error);
    return NextResponse.json(
      { error: "Failed to add preference" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/preferences/bands
 * Remove a single band from the user's preferences.
 * Body: { bandId: string }
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bandId } = await req.json();
    if (!bandId) {
      return NextResponse.json({ error: "bandId is required" }, { status: 400 });
    }

    await prisma.userBandPreference.deleteMany({
      where: {
        userId: session.user.id,
        bandId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing band preference:", error);
    return NextResponse.json(
      { error: "Failed to remove preference" },
      { status: 500 }
    );
  }
}
