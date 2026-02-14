import { NextResponse } from "next/server";
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
