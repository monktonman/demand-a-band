import { getPlatformStats, getMostDemandedBands, getDreamShowDemand, getDemandByCity, getGenreDemand } from "@/lib/demand-queries";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [session, stats, topBands, dreamShows, cityDemand, genreDemand] = await Promise.all([
    getServerSession(authOptions),
    getPlatformStats(),
    getMostDemandedBands(25),
    getDreamShowDemand(),
    getDemandByCity(),
    getGenreDemand(),
  ]);

  const userRole = session?.user?.role || "FAN";

  return (
    <AdminDashboardClient
      stats={stats}
      topBands={topBands}
      dreamShows={dreamShows}
      cityDemand={cityDemand}
      genreDemand={genreDemand}
      userRole={userRole}
    />
  );
}
