"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LayoutGrid, Calendar, Ticket, Globe, Sparkles, Filter, X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export interface UserPledgeInfo {
  pledgeId: string;
  eventId: string;
  status: string;
  hasTickets: boolean;
}

interface EventsViewProps {
  events: SerializedEvent[];
  externalEvents?: (ExternalEventData & { matchesPreferences?: boolean })[];
  allGenres?: string[];
  hasPreferences?: boolean;
  userGenres?: string[];
  userCities?: string[];
  userPledges?: UserPledgeInfo[];
}

export function EventsView({
  events,
  externalEvents = [],
  allGenres = [],
  hasPreferences = false,
  userGenres = [],
  userCities = [],
  userPledges = [],
}: EventsViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read view mode from URL params, default to "cards"
  const viewParam = searchParams.get("view");
  const view: ViewMode = viewParam === "calendar" ? "calendar" : "cards";

  const setView = useCallback(
    (newView: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newView === "cards") {
        params.delete("view");
      } else {
        params.set("view", newView);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const [source, setSource] = useState<SourceTab>(
    externalEvents.length > 0 ? "all" : "dab"
  );
  const [showMatchesOnly, setShowMatchesOnly] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  // Default to user's preferred city if it has events available
  const initialCity = useMemo(() => {
    if (userCities.length === 0) return "all";
    const eventCityKeys = new Set(
      externalEvents.map((e) => `${e.venueCity}, ${e.venueState}`)
    );
    const match = userCities.find((c) => eventCityKeys.has(c));
    return match ?? "all";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only compute on mount
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [showCityFilter, setShowCityFilter] = useState(false);

  const hasExternalEvents = externalEvents.length > 0;
  const hasDabEvents = events.length > 0;

  // Build sorted list of unique cities from external events
  const availableCities = useMemo(() => {
    const cityCounts = new Map<string, number>();
    for (const e of externalEvents) {
      const key = `${e.venueCity}, ${e.venueState}`;
      cityCounts.set(key, (cityCounts.get(key) || 0) + 1);
    }
    return Array.from(cityCounts.entries())
      .sort((a, b) => b[1] - a[1]) // most events first
      .map(([city, count]) => ({ label: city, count }));
  }, [externalEvents]);

  // Filter external events based on active filters
  const filteredExternalEvents = useMemo(() => {
    let filtered = externalEvents;

    // Filter by city
    if (selectedCity !== "all") {
      filtered = filtered.filter(
        (e) => `${e.venueCity}, ${e.venueState}` === selectedCity
      );
    }

    // Filter by "My Matches"
    if (showMatchesOnly) {
      filtered = filtered.filter((e) => e.matchesPreferences);
    }

    // Filter by selected genres
    if (selectedGenres.size > 0) {
      filtered = filtered.filter((e) =>
        e.genres.some((g) => selectedGenres.has(g))
      );
    }

    // Sort: matches first, then by date
    return filtered.sort((a, b) => {
      if (a.matchesPreferences && !b.matchesPreferences) return -1;
      if (!a.matchesPreferences && b.matchesPreferences) return 1;
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
  }, [externalEvents, showMatchesOnly, selectedGenres, selectedCity]);

  const matchCount = externalEvents.filter((e) => e.matchesPreferences).length;
  const isFiltering = showMatchesOnly || selectedGenres.size > 0 || selectedCity !== "all";

  // Pagination for external events
  const EVENTS_PER_PAGE = 12;
  const [externalPage, setExternalPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setExternalPage(1);
  }, [showMatchesOnly, selectedGenres, selectedCity, source]);

  const totalExternalPages = Math.ceil(filteredExternalEvents.length / EVENTS_PER_PAGE);
  const paginatedExternalEvents = filteredExternalEvents.slice(
    (externalPage - 1) * EVENTS_PER_PAGE,
    externalPage * EVENTS_PER_PAGE
  );

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) {
        next.delete(genre);
      } else {
        next.add(genre);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setShowMatchesOnly(false);
    setSelectedGenres(new Set());
    setSelectedCity("all");
  };

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

  // External events for calendar (use filtered list)
  const calendarExternalEvents = filteredExternalEvents.map((e) => ({
    id: e.id,
    artistName: e.artistName,
    venueName: e.venueName,
    venueCity: e.venueCity,
    venueState: e.venueState,
    eventDate: e.eventDate,
    eventTime: e.eventTime,
    ticketUrl: e.ticketUrl,
    priceMin: e.priceMin,
    priceMax: e.priceMax,
    genres: e.genres,
    source: e.source,
    matchesPreferences: e.matchesPreferences,
  }));

  const showDabCards = source === "all" || source === "dab";
  const showExternalCards = source === "all" || source === "external";

  // Compute display counts for source tabs (respects filters)
  const filteredExternalCount = filteredExternalEvents.length;
  const displayTotalCount = events.length + filteredExternalCount;

  return (
    <div>
      {/* Controls bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Source tabs (only show if we have external events) */}
        {hasExternalEvents && (
          <div data-tour="events-tabs" className="flex items-center gap-1 rounded-lg border bg-zinc-50 p-1">
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
                ({displayTotalCount})
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
              Concerts
              <span className="text-xs text-zinc-400">
                ({filteredExternalCount})
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

      {/* Filter bar (show when viewing external events) */}
      {hasExternalEvents && showExternalCards && (
        <div data-tour="events-filters" className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* My Matches toggle (only show if user has preferences) */}
            {hasPreferences && matchCount > 0 && (
              <button
                onClick={() => setShowMatchesOnly(!showMatchesOnly)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  showMatchesOnly
                    ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
                    : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                My Matches
                <span className={`text-xs ${showMatchesOnly ? "text-amber-600" : "text-zinc-400"}`}>
                  ({matchCount})
                </span>
              </button>
            )}

            {/* Location filter toggle */}
            {availableCities.length > 1 && (
              <button
                onClick={() => { setShowCityFilter(!showCityFilter); setShowGenreFilter(false); }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  selectedCity !== "all"
                    ? "bg-green-100 text-green-800 border border-green-300 shadow-sm"
                    : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                {selectedCity !== "all" ? selectedCity : "Location"}
              </button>
            )}

            {/* Genre filter toggle */}
            {allGenres.length > 0 && (
              <button
                onClick={() => { setShowGenreFilter(!showGenreFilter); setShowCityFilter(false); }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  selectedGenres.size > 0
                    ? "bg-blue-100 text-blue-800 border border-blue-300 shadow-sm"
                    : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Genre
                {selectedGenres.size > 0 && (
                  <span className="text-xs text-blue-600">
                    ({selectedGenres.size})
                  </span>
                )}
              </button>
            )}

            {/* Clear filters */}
            {isFiltering && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>

          {/* City chips (expandable) */}
          {showCityFilter && availableCities.length > 1 && (
            <div className="flex flex-wrap gap-1.5 rounded-lg border bg-zinc-50/50 p-3">
              <button
                onClick={() => setSelectedCity("all")}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedCity === "all"
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-green-300 hover:text-green-700"
                }`}
              >
                All Cities ({externalEvents.length})
              </button>
              {availableCities.map(({ label, count }) => (
                <button
                  key={label}
                  onClick={() => setSelectedCity(label)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedCity === label
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:border-green-300 hover:text-green-700"
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Genre chips (expandable) */}
          {showGenreFilter && allGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 rounded-lg border bg-zinc-50/50 p-3">
              {allGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedGenres.has(genre)
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
          {showExternalCards && filteredExternalEvents.length > 0 && (
            <div>
              {source === "all" && (
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  {selectedCity !== "all" ? `Happening in ${selectedCity}` : "Concerts Near You"}
                  {isFiltering && (
                    <span className="text-xs font-normal text-zinc-400">
                      (showing {filteredExternalEvents.length} of {externalEvents.length})
                    </span>
                  )}
                </h3>
              )}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedExternalEvents.map((event) => (
                  <ExternalEventCard
                    key={event.id}
                    event={event}
                    matchesPreferences={event.matchesPreferences}
                  />
                ))}
              </div>

              {/* Pagination controls */}
              {totalExternalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExternalPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={externalPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalExternalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first, last, current, and neighbors
                        if (page === 1 || page === totalExternalPages) return true;
                        if (Math.abs(page - externalPage) <= 1) return true;
                        return false;
                      })
                      .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                        if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                          acc.push("ellipsis");
                        }
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "ellipsis" ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-zinc-400">
                            &hellip;
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => {
                              setExternalPage(item);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                              externalPage === item
                                ? "bg-orange-600 text-white shadow-sm"
                                : "text-zinc-600 hover:bg-zinc-100"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExternalPage((p) => Math.min(totalExternalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={externalPage === totalExternalPages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Page info */}
              {totalExternalPages > 1 && (
                <p className="mt-3 text-center text-xs text-zinc-400">
                  Showing {(externalPage - 1) * EVENTS_PER_PAGE + 1}–{Math.min(externalPage * EVENTS_PER_PAGE, filteredExternalEvents.length)} of {filteredExternalEvents.length} concerts
                </p>
              )}
            </div>
          )}

          {/* Empty state when filtered to a source with no events */}
          {showDabCards && !hasDabEvents && source === "dab" && (
            <div className="py-12 text-center text-zinc-500">
              <p>No DAB shows yet. Set your music preferences to help propose shows!</p>
            </div>
          )}
          {showExternalCards && filteredExternalEvents.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              {isFiltering ? (
                <div>
                  <p className="font-medium text-zinc-600">No concerts match your filters</p>
                  <p className="mt-1 text-sm">
                    Try removing some filters or{" "}
                    <button
                      onClick={clearFilters}
                      className="text-blue-600 hover:underline"
                    >
                      clear all filters
                    </button>
                  </p>
                </div>
              ) : (
                <p>No upcoming concerts found. Check back soon!</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <EventsCalendar
          events={showDabCards ? calendarEvents : []}
          externalEvents={showExternalCards ? calendarExternalEvents : []}
          userPledges={userPledges}
        />
      )}
    </div>
  );
}
