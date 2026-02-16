import { prisma } from "@/lib/prisma";
import { AdminBandsClient } from "./bands-client";

export const dynamic = "force-dynamic";

export default async function AdminBandsPage() {
  const bands = await prisma.band.findMany({
    orderBy: { popularity: "desc" },
    include: {
      _count: { select: { userPreferences: true, events: true } },
      userPreferences: {
        select: { maxTicketPrice: true, isDreamShow: true },
      },
    },
  });

  const bandsWithStats = bands.map((band) => {
    const prefs = band.userPreferences;
    const dreamPrefs = prefs.filter((p) => p.isDreamShow);
    const avgPrice =
      prefs.length > 0
        ? Math.round(prefs.reduce((s, p) => s + Number(p.maxTicketPrice), 0) / prefs.length)
        : 0;

    return {
      id: band.id,
      name: band.name,
      genres: band.genres,
      popularity: band.popularity ?? 0,
      demandCount: band._count.userPreferences,
      eventCount: band._count.events,
      avgPrice,
      dreamShowCount: dreamPrefs.length,
    };
  });

  return <AdminBandsClient bands={bandsWithStats} />;
}
