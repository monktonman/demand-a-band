import { prisma } from "@/lib/prisma";
import { EventCard } from "@/components/events/event-card";
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <p className="mt-2 text-zinc-500">
          Browse proposed events and pledge your support to make them happen.
        </p>
      </div>

      {events.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <Music className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
          <h2 className="text-xl font-semibold text-zinc-700">
            No events yet
          </h2>
          <p className="mt-2 text-zinc-500">
            Events will appear here once we have enough demand to propose shows.
            Make sure you&apos;ve completed your onboarding preferences!
          </p>
        </div>
      )}
    </div>
  );
}
