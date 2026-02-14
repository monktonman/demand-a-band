import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";
import {
  getPlatformStats,
  getMostDemandedBands,
  getDreamShowDemand,
  getDemandByCity,
} from "@/lib/demand-queries";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats, topBands, dreamShows, cityDemand] = await Promise.all([
      getPlatformStats(),
      getMostDemandedBands(15),
      getDreamShowDemand(),
      getDemandByCity(),
    ]);

    return NextResponse.json({
      stats,
      topBands,
      dreamShows,
      cityDemand,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
