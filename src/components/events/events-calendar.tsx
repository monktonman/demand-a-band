"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Music2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { EventStatus } from "@prisma/client";

interface CalendarEvent {
  id: string;
  slug: string;
  title: string;
  status: EventStatus;
  eventDate: string; // ISO string from serialization
  ticketPrice: number;
  minPledges: number;
  band: { name: string; genres: string[] };
  venue: { name: string; city: string };
  _count: { pledges: number };
}

interface ExternalCalendarEvent {
  id: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  eventTime: string | null;
  ticketUrl: string | null;
  priceMin: string | null;
  priceMax: string | null;
  genres: string[];
}

type CalendarItem =
  | { type: "dab"; event: CalendarEvent }
  | { type: "external"; event: ExternalCalendarEvent };

interface EventsCalendarProps {
  events: CalendarEvent[];
  externalEvents?: ExternalCalendarEvent[];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EventsCalendar({ events, externalEvents = [] }: EventsCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Group all events by day
  const eventsByDay = new Map<number, CalendarItem[]>();

  // DAB events
  events.forEach((event) => {
    const d = new Date(event.eventDate);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push({ type: "dab", event });
    }
  });

  // External events
  externalEvents.forEach((event) => {
    const d = new Date(event.eventDate);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push({ type: "external", event });
    }
  });

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  function goToToday() {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }

  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const hasExternalEvents = externalEvents.length > 0;

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-zinc-900">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          {!isCurrentMonth && (
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs text-orange-600 hover:text-orange-700">
              Today
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      {hasExternalEvents && (
        <div className="mb-3 flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            DAB Shows
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Upcoming Concerts
          </span>
        </div>
      )}

      {/* Desktop calendar grid */}
      <div className="hidden md:block overflow-hidden rounded-lg border">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-zinc-50">
          {DAY_NAMES.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-zinc-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const isToday =
              day === today.getDate() && isCurrentMonth;
            const dayItems = day ? eventsByDay.get(day) || [] : [];

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r p-1.5 ${
                  day ? "bg-white" : "bg-zinc-50/50"
                } ${idx % 7 === 6 ? "border-r-0" : ""}`}
              >
                {day && (
                  <>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-orange-600 text-white"
                          : "text-zinc-700"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayItems.map((item) =>
                        item.type === "dab" ? (
                          <Link
                            key={item.event.id}
                            href={`/events/${item.event.slug}`}
                            className="group/item block"
                          >
                            <div
                              className={`rounded px-1.5 py-0.5 text-xs leading-tight transition-opacity hover:opacity-80 ${
                                item.event.status === "CONFIRMED"
                                  ? "bg-green-100 text-green-800"
                                  : item.event.status === "THRESHOLD_MET"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              <span className="font-medium">{item.event.band.name}</span>
                              <span className="hidden lg:inline text-[10px] opacity-70"> · {item.event.venue.name}</span>
                            </div>
                          </Link>
                        ) : (
                          item.event.ticketUrl ? (
                            <a
                              key={item.event.id}
                              href={item.event.ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/item block"
                            >
                              <div className="rounded px-1.5 py-0.5 text-xs leading-tight bg-blue-50 text-blue-800 transition-opacity hover:opacity-80">
                                <span className="font-medium">{item.event.artistName}</span>
                                <span className="hidden lg:inline text-[10px] opacity-70"> · {item.event.venueName}</span>
                              </div>
                            </a>
                          ) : (
                            <div
                              key={item.event.id}
                              className="rounded px-1.5 py-0.5 text-xs leading-tight bg-blue-50 text-blue-800"
                            >
                              <span className="font-medium">{item.event.artistName}</span>
                              <span className="hidden lg:inline text-[10px] opacity-70"> · {item.event.venueName}</span>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile agenda view */}
      <div className="space-y-2 md:hidden">
        {(() => {
          const daysWithEvents = Array.from(eventsByDay.keys()).sort((a, b) => a - b);

          if (daysWithEvents.length === 0) {
            return (
              <div className="py-12 text-center">
                <Music2 className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                <p className="text-sm text-zinc-500">No shows this month</p>
              </div>
            );
          }

          return daysWithEvents.map((day) => {
            const dayDate = new Date(currentYear, currentMonth, day);
            const dayLabel = dayDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const isToday = day === today.getDate() && isCurrentMonth;
            const dayItems = eventsByDay.get(day)!;

            return (
              <div key={day}>
                <div className={`mb-1 flex items-center gap-2 text-xs font-medium ${isToday ? "text-orange-600" : "text-zinc-500"}`}>
                  {isToday && <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />}
                  {dayLabel}
                  {isToday && <span className="text-[10px] font-normal">(today)</span>}
                </div>
                <div className="space-y-1.5">
                  {dayItems.map((item) =>
                    item.type === "dab" ? (
                      <Link
                        key={item.event.id}
                        href={`/events/${item.event.slug}`}
                        className="block rounded-lg border bg-white p-3 transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100">
                              <Music2 className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{item.event.band.name}</p>
                              <p className="text-xs text-zinc-500">{item.event.venue.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">{formatCurrency(item.event.ticketPrice)}</span>
                            <Badge className={`ml-2 text-[10px] ${EVENT_STATUS_COLORS[item.event.status]}`}>
                              {EVENT_STATUS_LABELS[item.event.status]}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-zinc-500">
                            <span>{item.event._count.pledges} / {item.event.minPledges} pledges</span>
                            <span>{Math.round(Math.min((item.event._count.pledges / item.event.minPledges) * 100, 100))}%</span>
                          </div>
                          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                              style={{ width: `${Math.min((item.event._count.pledges / item.event.minPledges) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div
                        key={item.event.id}
                        className="rounded-lg border border-blue-100 bg-blue-50/50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
                              <Music2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{item.event.artistName}</p>
                              <p className="text-xs text-zinc-500">
                                {item.event.venueName}
                                {item.event.eventTime && ` · ${item.event.eventTime}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {item.event.priceMin && (
                              <span className="text-sm font-bold">
                                ${Math.round(Number(item.event.priceMin))}+
                              </span>
                            )}
                            {item.event.ticketUrl && (
                              <a
                                href={item.event.ticketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline"
                              >
                                Tickets <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
