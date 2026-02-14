import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bands = await prisma.band.findMany({
    orderBy: { popularity: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      genres: true,
      imageUrl: true,
      popularity: true,
    },
  });

  return NextResponse.json({ bands });
}
