import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOperatorVenueFilter } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { AdminEventsClient } from "./events-client";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const session = await getServerSession(authOptions);
  const venueFilter = session ? getOperatorVenueFilter(session) : [];

  const events = await prisma.event.findMany({
    where: venueFilter ? { venueId: { in: venueFilter } } : undefined,
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
