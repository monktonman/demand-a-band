"use client";

import { useState } from "react";
import { LayoutGrid, Calendar, Ticket, Globe } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { ExternalEventCard, type ExternalEventData } from "@/components/events/external-event-card";
import { EventsCalendar } from "@/components/events/events-calendar";
import type { EventStatus, Band, Venue } from "@prisma/client";

type ViewMode = "cards" | "calendar";
type SourceTab = "all" | "dab" | "external";

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
  externalEvents?: ExternalEventData[];
}

export function EventsView({ events, externalEvents = [] }: EventsViewProps) {
  const [view, setView] = useState<ViewMode>("cards");
  const [source, setSource] = useState<SourceTab>(
    externalEvents.length > 0 ? "all" : "dab"
  );

  const hasExternalEvents = externalEvents.length > 0;
  const hasDabEvents = events.length > 0;

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

  // External events for calendar
  const calendarExternalEvents = externalEvents.map((e) => ({
    id: e.id,
    artistName: e.artistName,
    venueName: e.venueName,
    eventDate: e.eventDate,
    eventTime: e.eventTime,
    ticketUrl: e.ticketUrl,
    priceMin: e.priceMin,
    priceMax: e.priceMax,
    genres: e.genres,
  }));

  const showDabCards = source === "all" || source === "dab";
  const showExternalCards = source === "all" || source === "external";

  return (
    <div>
      {/* Controls bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Source tabs (only show if we have external events) */}
        {hasExternalEvents && (
          <div className="flex items-center gap-1 rounded-lg border bg-zinc-50 p-1">
            <button
              onClick={() => setSource("all")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                source === "all"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              All
              <span className="text-xs text-zinc-400">
                ({events.length + externalEvents.length})
              </span>
            </button>
            <button
              onClick={() => setSource("dab")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                source === "dab"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Ticket className="h-3.5 w-3.5" />
              DAB Shows
              {hasDabEvents && (
                <span className="text-xs text-zinc-400">({events.length})</span>
              )}
            </button>
            <button
              onClick={() => setSource("external")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                source === "external"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Baltimore
              <span className="text-xs text-zinc-400">
                ({externalEvents.length})
              </span>
            </button>
          </div>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border bg-zinc-50 p-1 w-fit">
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
      </div>

      {/* Content */}
      {view === "cards" ? (
        <div className="space-y-8">
          {/* DAB Events */}
          {showDabCards && hasDabEvents && (
            <div>
              {source === "all" && hasExternalEvents && (
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  DAB Shows
                </h3>
              )}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {hydratedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* External Events */}
          {showExternalCards && hasExternalEvents && (
            <div>
              {source === "all" && (
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Happening in Baltimore
                </h3>
              )}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {externalEvents.map((event) => (
                  <ExternalEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state when filtered to a source with no events */}
          {showDabCards && !hasDabEvents && source === "dab" && (
            <div className="py-12 text-center text-zinc-500">
              <p>No DAB shows yet. Set your music preferences to help propose shows!</p>
            </div>
          )}
          {showExternalCards && !hasExternalEvents && source === "external" && (
            <div className="py-12 text-center text-zinc-500">
              <p>No upcoming concerts found. Check back soon!</p>
            </div>
          )}
        </div>
      ) : (
        <EventsCalendar
          events={showDabCards ? calendarEvents : []}
          externalEvents={showExternalCards ? calendarExternalEvents : []}
        />
      )}
    </div>
  );
}
