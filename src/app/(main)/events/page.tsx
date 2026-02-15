import { prisma } from "@/lib/prisma";
import { EventsView } from "@/components/events/events-view";
import { Music } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: {
      status: { in: ["PROPOSED", "THRESHOLD_MET", "CONFIRMED"] },
    },
    include: {
      band: true,
      venue: true,
      _count: { select: { pledges: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  // Serialize dates and Decimals for client component
  const serializedEvents = events.map((e) => ({
    ...e,
    eventDate: e.eventDate.toISOString(),
    windowStart: e.windowStart?.toISOString() ?? null,
    windowEnd: e.windowEnd?.toISOString() ?? null,
    ticketPrice: e.ticketPrice.toString(),
    serviceFee: e.serviceFee.toString(),
    pledgeDeadline: e.pledgeDeadline.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    confirmedAt: e.confirmedAt?.toISOString() ?? null,
    cancelledAt: e.cancelledAt?.toISOString() ?? null,
    doorsTime: e.doorsTime?.toISOString() ?? null,
    showTime: e.showTime?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Proposed Shows</h1>
        <p className="mt-2 text-zinc-500">
          Browse proposed shows and pledge your support to make them happen.
        </p>
      </div>

      {events.length > 0 ? (
        <EventsView events={serializedEvents} />
      ) : (
        <div className="py-24 text-center">
          <Music className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
          <h2 className="text-xl font-semibold text-zinc-700">
            No shows yet
          </h2>
          <p className="mt-2 text-zinc-500">
            Proposed shows will appear here once we have enough demand.
            Make sure you&apos;ve completed your onboarding preferences!
          </p>
        </div>
      )}
    </div>
  );
}
