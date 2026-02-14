import { getMostDemandedBands, getDreamShowDemand, getDemandByCity } from "@/lib/demand-queries";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";
import { getPlatformStats } from "@/lib/demand-queries";

export const dynamic = "force-dynamic";

export default async function DemandAnalyticsPage() {
  const [stats, topBands, dreamShows, cityDemand] = await Promise.all([
    getPlatformStats(),
    getMostDemandedBands(25),
    getDreamShowDemand(),
    getDemandByCity(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demand Analytics</h1>
        <p className="text-zinc-500">
          Deep dive into fan demand signals, pricing data, and dream show
          opportunities
        </p>
      </div>

      <AdminDashboardClient
        stats={stats}
        topBands={topBands}
        dreamShows={dreamShows}
        cityDemand={cityDemand}
      />
    </div>
  );
}
