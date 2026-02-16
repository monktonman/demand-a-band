import { getPlatformStats, getMostDemandedBands, getDreamShowDemand, getDemandByCity, getGenreDemand } from "@/lib/demand-queries";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, topBands, dreamShows, cityDemand, genreDemand] = await Promise.all([
    getPlatformStats(),
    getMostDemandedBands(25),
    getDreamShowDemand(),
    getDemandByCity(),
    getGenreDemand(),
  ]);

  return (
    <AdminDashboardClient
      stats={stats}
      topBands={topBands}
      dreamShows={dreamShows}
      cityDemand={cityDemand}
      genreDemand={genreDemand}
    />
  );
}
