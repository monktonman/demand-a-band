import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin, isStaffRole, isOperatorForVenue } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

// PATCH: Update venue (admin or assigned operator)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isOperatorForVenue(session, id)) {
    return NextResponse.json({ error: "You do not manage this venue" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, address, city, state, zipCode, capacity, venueType, genres, ownership } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (venueType !== undefined) updateData.venueType = venueType;
    if (genres !== undefined) updateData.genres = genres;
    if (ownership !== undefined) updateData.ownership = ownership;

    const venue = await prisma.venue.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ venue });
  } catch (error) {
    console.error("Error updating venue:", error);
    return NextResponse.json(
      { error: "Failed to update venue" },
      { status: 500 }
    );
  }
}

// DELETE: Remove venue
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Check for active events at this venue
    const activeEvents = await prisma.event.count({
      where: {
        venueId: id,
        status: { in: ["PROPOSED", "THRESHOLD_MET", "CONFIRMED"] },
      },
    });

    if (activeEvents > 0) {
      return NextResponse.json(
        { error: `Cannot delete venue with ${activeEvents} active event(s)` },
        { status: 400 }
      );
    }

    await prisma.venue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting venue:", error);
    return NextResponse.json(
      { error: "Failed to delete venue" },
      { status: 500 }
    );
  }
}
