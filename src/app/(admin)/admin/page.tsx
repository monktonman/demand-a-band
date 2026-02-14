import { getPlatformStats, getMostDemandedBands, getDreamShowDemand, getDemandByCity } from "@/lib/demand-queries";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, topBands, dreamShows, cityDemand] = await Promise.all([
    getPlatformStats(),
    getMostDemandedBands(15),
    getDreamShowDemand(),
    getDemandByCity(),
  ]);

  return (
    <AdminDashboardClient
      stats={stats}
      topBands={topBands}
      dreamShows={dreamShows}
      cityDemand={cityDemand}
    />
  );
}
