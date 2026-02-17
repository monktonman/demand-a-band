import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

// GET: Fetch single user with all related data (admin only)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      bandPreferences: {
        include: {
          band: { select: { id: true, name: true, slug: true, genres: true, imageUrl: true } },
        },
        orderBy: { priority: "asc" },
      },
      cityPreferences: {
        orderBy: { createdAt: "desc" },
      },
      genrePreferences: {
        orderBy: { genre: "asc" },
      },
      pledges: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              eventDate: true,
              band: { select: { name: true } },
              venue: { select: { name: true, city: true, state: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      tickets: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              band: { select: { name: true } },
              venue: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      dreamShows: {
        include: {
          band: { select: { id: true, name: true, imageUrl: true } },
          venue: { select: { id: true, name: true, city: true, state: true } },
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      feedback: {
        orderBy: { createdAt: "desc" },
      },
      venueOperators: {
        include: {
          venue: { select: { id: true, name: true, city: true, state: true, capacity: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Serialize Decimal fields to strings for JSON
  const serialized = {
    ...user,
    bandPreferences: user.bandPreferences.map((bp) => ({
      ...bp,
      maxTicketPrice: bp.maxTicketPrice.toString(),
    })),
    pledges: user.pledges.map((p) => ({
      ...p,
      totalAmount: p.totalAmount.toString(),
    })),
    dreamShows: user.dreamShows.map((ds) => ({
      ...ds,
      maxTicketPrice: ds.maxTicketPrice.toString(),
    })),
  };

  return NextResponse.json({ user: serialized });
}

// PATCH: Update user (role, name, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { role, name, venueIds } = body;

    // Prevent admin from demoting themselves
    if (id === session.user.id && role && role !== "ADMIN") {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;
    if (name !== undefined) updateData.name = name;

    // Update user fields
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    // Update venue assignments if provided
    if (venueIds !== undefined && Array.isArray(venueIds)) {
      // Delete existing assignments and create new ones
      await prisma.$transaction([
        prisma.venueOperator.deleteMany({ where: { userId: id } }),
        ...venueIds.map((venueId: string) =>
          prisma.venueOperator.create({
            data: { userId: id, venueId },
          })
        ),
      ]);
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE: Remove user
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    // Delete related records first (cascading)
    await prisma.$transaction([
      prisma.userBandPreference.deleteMany({ where: { userId: id } }),
      prisma.userCityPreference.deleteMany({ where: { userId: id } }),
      prisma.userGenrePreference.deleteMany({ where: { userId: id } }),
      prisma.pledge.deleteMany({ where: { userId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.dreamShowVote.deleteMany({ where: { userId: id } }),
      prisma.dreamShow.deleteMany({ where: { creatorId: id } }),
      prisma.feedback.deleteMany({ where: { userId: id } }),
      prisma.venueOperator.deleteMany({ where: { userId: id } }),
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
