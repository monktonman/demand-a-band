import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "48")));
  const skip = (page - 1) * limit;

  // Search
  const search = searchParams.get("search")?.trim();

  // Genre filter
  const genre = searchParams.get("genre")?.trim();

  // Sort
  const sortBy = searchParams.get("sortBy") || "popularity";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  const conditions = [];

  if (search && search.length >= 1) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { genres: { hasSome: [search] } },
      ],
    });
  }

  if (genre) {
    conditions.push({
      genres: { has: genre },
    });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  // Build orderBy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any;
  switch (sortBy) {
    case "name":
      orderBy = { name: sortOrder };
      break;
    case "demand":
      orderBy = { userPreferences: { _count: sortOrder } };
      break;
    case "popularity":
    default:
      orderBy = { popularity: sortOrder };
      break;
  }

  const [bands, total] = await Promise.all([
    prisma.band.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        genres: true,
        imageUrl: true,
        popularity: true,
        monthlyListeners: true,
        _count: {
          select: { userPreferences: true, events: true },
        },
      },
    }),
    prisma.band.count({ where }),
  ]);

  // Get all unique genres for the filter
  const allGenres = await prisma.band.findMany({
    select: { genres: true },
    distinct: ["genres"],
  });
  const genres = [...new Set(allGenres.flatMap((b) => b.genres))].sort();

  return NextResponse.json({
    bands,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    genres,
  });
}
