import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!query || query.length < 2) {
    return NextResponse.json({ bands: [] });
  }

  const bands = await prisma.band.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { genres: { hasSome: [query] } },
      ],
    },
    orderBy: { popularity: "desc" },
    take: limit,
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
