import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "@/lib/utils";

// POST: Create a new dream show
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bandId, venueId, maxTicketPrice, priceTierLabel, message } = body;

    if (!bandId || !venueId || !maxTicketPrice || !priceTierLabel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a short, memorable share code
    const shareCode = nanoid(8);

    const dreamShow = await prisma.dreamShow.create({
      data: {
        shareCode,
        creatorId: session.user.id,
        bandId,
        venueId,
        maxTicketPrice,
        priceTierLabel,
        message: message || null,
      },
      include: {
        band: true,
        venue: true,
        creator: { select: { name: true } },
        _count: { select: { votes: true } },
      },
    });

    // Auto-vote for the creator
    await prisma.dreamShowVote.create({
      data: {
        dreamShowId: dreamShow.id,
        userId: session.user.id,
        voterName: session.user.name || null,
      },
    });

    // Also save as a band preference with isDreamShow = true
    await prisma.userBandPreference.upsert({
      where: {
        userId_bandId: {
          userId: session.user.id,
          bandId,
        },
      },
      update: {
        maxTicketPrice,
        isDreamShow: true,
      },
      create: {
        userId: session.user.id,
        bandId,
        maxTicketPrice,
        isDreamShow: true,
        priority: 1,
      },
    });

    return NextResponse.json({
      dreamShow: {
        ...dreamShow,
        voteCount: 1, // creator's auto-vote
      },
      shareCode,
      shareUrl: `/dream-show/${shareCode}`,
    });
  } catch (error) {
    console.error("Error creating dream show:", error);
    return NextResponse.json(
      { error: "Failed to create dream show" },
      { status: 500 }
    );
  }
}

// GET: List dream shows (optionally filtered by user)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine");

  try {
    if (mine === "true") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const dreamShows = await prisma.dreamShow.findMany({
        where: { creatorId: session.user.id },
        include: {
          band: true,
          venue: true,
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ dreamShows });
    }

    // Public: top dream shows by vote count
    const dreamShows = await prisma.dreamShow.findMany({
      include: {
        band: true,
        venue: true,
        creator: { select: { name: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ dreamShows });
  } catch (error) {
    console.error("Error fetching dream shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch dream shows" },
      { status: 500 }
    );
  }
}
