import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch a dream show by share code (public)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  const { shareCode } = await params;

  try {
    const dreamShow = await prisma.dreamShow.findUnique({
      where: { shareCode },
      include: {
        band: true,
        venue: true,
        creator: { select: { name: true, image: true } },
        votes: {
          select: {
            id: true,
            voterName: true,
            createdAt: true,
            userId: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!dreamShow) {
      return NextResponse.json(
        { error: "Dream show not found" },
        { status: 404 }
      );
    }

    // Check if current user has already voted
    const session = await getServerSession(authOptions);
    const hasVoted = session?.user?.id
      ? dreamShow.votes.some((v) => v.userId === session.user.id)
      : false;

    return NextResponse.json({
      dreamShow: {
        id: dreamShow.id,
        shareCode: dreamShow.shareCode,
        band: dreamShow.band,
        venue: dreamShow.venue,
        maxTicketPrice: dreamShow.maxTicketPrice,
        priceTierLabel: dreamShow.priceTierLabel,
        message: dreamShow.message,
        creator: dreamShow.creator,
        voteCount: dreamShow._count.votes,
        votes: dreamShow.votes.map((v) => ({
          id: v.id,
          name: v.voterName || "Anonymous fan",
          createdAt: v.createdAt,
        })),
        createdAt: dreamShow.createdAt,
      },
      hasVoted,
    });
  } catch (error) {
    console.error("Error fetching dream show:", error);
    return NextResponse.json(
      { error: "Failed to fetch dream show" },
      { status: 500 }
    );
  }
}

// POST: Vote / opt-in for a dream show
export async function POST(
  req: Request,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  const { shareCode } = await params;

  try {
    const dreamShow = await prisma.dreamShow.findUnique({
      where: { shareCode },
      select: { id: true, bandId: true },
    });

    if (!dreamShow) {
      return NextResponse.json(
        { error: "Dream show not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));

    if (session?.user?.id) {
      // Logged-in user: create vote with userId
      // Check for existing vote
      const existing = await prisma.dreamShowVote.findUnique({
        where: {
          dreamShowId_userId: {
            dreamShowId: dreamShow.id,
            userId: session.user.id,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "You've already opted in!", alreadyVoted: true },
          { status: 409 }
        );
      }

      await prisma.dreamShowVote.create({
        data: {
          dreamShowId: dreamShow.id,
          userId: session.user.id,
          voterName: session.user.name || body.name || null,
        },
      });

      // Also save as band preference
      await prisma.userBandPreference.upsert({
        where: {
          userId_bandId: {
            userId: session.user.id,
            bandId: dreamShow.bandId,
          },
        },
        update: { isDreamShow: true },
        create: {
          userId: session.user.id,
          bandId: dreamShow.bandId,
          maxTicketPrice: 100,
          isDreamShow: true,
          priority: 1,
        },
      });
    } else {
      // Anonymous voter: just record name/email
      await prisma.dreamShowVote.create({
        data: {
          dreamShowId: dreamShow.id,
          voterName: body.name || "Anonymous fan",
          voterEmail: body.email || null,
        },
      });
    }

    // Get updated count
    const voteCount = await prisma.dreamShowVote.count({
      where: { dreamShowId: dreamShow.id },
    });

    return NextResponse.json({ success: true, voteCount });
  } catch (error) {
    console.error("Error voting for dream show:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}
