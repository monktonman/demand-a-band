import { prisma } from "@/lib/prisma";
import { AdminEventsClient } from "./events-client";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
    include: {
      band: true,
      venue: true,
      _count: { select: { pledges: true } },
    },
  });

  const serialized = events.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    eventDate: e.eventDate.toISOString(),
    ticketPrice: e.ticketPrice.toString(),
    minPledges: e.minPledges,
    bandName: e.band.name,
    venueName: e.venue.name,
    pledgeCount: e._count.pledges,
  }));

  return <AdminEventsClient events={serialized} />;
}
