import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";
import { getBandsByGenreWithDemand } from "@/lib/demand-queries";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const genre = searchParams.get("genre");

  if (!genre) {
    return NextResponse.json(
      { error: "genre parameter is required" },
      { status: 400 }
    );
  }

  const search = searchParams.get("search") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
  const sortByParam = searchParams.get("sortBy") || "demand";
  const sortBy = (["demand", "name", "popularity"].includes(sortByParam)
    ? sortByParam
    : "demand") as "demand" | "name" | "popularity";

  try {
    const result = await getBandsByGenreWithDemand(genre, {
      search,
      page,
      limit,
      sortBy,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin Demand Bands] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch band demand data" },
      { status: 500 }
    );
  }
}
