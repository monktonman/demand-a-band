import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const venues = await prisma.venue.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      capacity: true,
    },
  });

  return NextResponse.json({ venues });
}

// POST: Create a new venue (admin only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, address, city, state, zipCode, capacity, venueType, genres, ownership } = body;

    if (!name || !city || !state) {
      return NextResponse.json(
        { error: "Name, city, and state are required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const venue = await prisma.venue.create({
      data: {
        name,
        slug,
        address: address || "",
        city,
        state,
        zipCode: zipCode || "",
        capacity: Number(capacity) || 100,
        venueType: venueType || "Club",
        genres: genres || [],
        ownership: ownership || "INDEPENDENT",
      },
    });

    return NextResponse.json({ venue }, { status: 201 });
  } catch (error) {
    console.error("Error creating venue:", error);
    return NextResponse.json(
      { error: "Failed to create venue" },
      { status: 500 }
    );
  }
}
