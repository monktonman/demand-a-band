"use client";

import { useState } from "react";
import { LayoutGrid, Calendar } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { EventsCalendar } from "@/components/events/events-calendar";
import type { EventStatus, Band, Venue } from "@prisma/client";

type ViewMode = "cards" | "calendar";

interface SerializedEvent {
  id: string;
  slug: string;
  title: string;
  status: EventStatus;
  windowStart: string | null;
  windowEnd: string | null;
  eventDate: string;
  ticketPrice: string;
  serviceFee: string;
  minPledges: number;
  maxCapacity: number;
  band: Band;
  venue: Venue;
  _count: { pledges: number };
}

interface EventsViewProps {
  events: SerializedEvent[];
}

export function EventsView({ events }: EventsViewProps) {
  const [view, setView] = useState<ViewMode>("cards");

  // Convert serialized dates back for EventCard
  const hydratedEvents = events.map((e) => ({
    ...e,
    eventDate: new Date(e.eventDate),
    windowStart: e.windowStart ? new Date(e.windowStart) : null,
    windowEnd: e.windowEnd ? new Date(e.windowEnd) : null,
  }));

  // For the calendar, pass serialized events with numeric ticket price
  const calendarEvents = events.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    status: e.status,
    eventDate: e.eventDate,
    ticketPrice: Number(e.ticketPrice),
    minPledges: e.minPledges,
    band: { name: e.band.name, genres: e.band.genres },
    venue: { name: e.venue.name, city: e.venue.city },
    _count: e._count,
  }));

  return (
    <div>
      {/* View toggle */}
      <div className="mb-6 flex items-center gap-1 rounded-lg border bg-zinc-50 p-1 w-fit">
        <button
          onClick={() => setView("cards")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "cards"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Cards
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "calendar"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </button>
      </div>

      {/* Content */}
      {view === "cards" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hydratedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EventsCalendar events={calendarEvents} />
      )}
    </div>
  );
}
