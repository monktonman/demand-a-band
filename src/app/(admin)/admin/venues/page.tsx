import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOperatorVenueFilter } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { AdminVenuesClient } from "./admin-venues-client";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const session = await getServerSession(authOptions);
  const venueFilter = session ? getOperatorVenueFilter(session) : [];
  const isAdmin = session?.user?.role === "ADMIN";

  const venues = await prisma.venue.findMany({
    where: venueFilter ? { id: { in: venueFilter } } : undefined,
    orderBy: { capacity: "desc" },
    include: {
      _count: { select: { events: true } },
    },
  });

  const serialized = venues.map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address,
    city: v.city,
    state: v.state,
    zipCode: v.zipCode,
    capacity: v.capacity,
    venueType: v.venueType,
    genres: v.genres,
    ownership: v.ownership,
    eventCount: v._count.events,
  }));

  return <AdminVenuesClient venues={serialized} readOnly={!isAdmin} />;
}
