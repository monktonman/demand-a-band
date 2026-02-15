"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Music2 } from "lucide-react";
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

interface EventsCalendarProps {
  events: CalendarEvent[];
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

export function EventsCalendar({ events }: EventsCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Group events by day
  const eventsByDay = new Map<number, CalendarEvent[]>();
  events.forEach((event) => {
    const d = new Date(event.eventDate);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(event);
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
  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

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
            const dayEvents = day ? eventsByDay.get(day) || [] : [];

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
                      {dayEvents.map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.slug}`}
                          className="group block"
                        >
                          <div
                            className={`rounded px-1.5 py-0.5 text-xs leading-tight transition-opacity hover:opacity-80 ${
                              event.status === "CONFIRMED"
                                ? "bg-green-100 text-green-800"
                                : event.status === "THRESHOLD_MET"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            <span className="font-medium">{event.band.name}</span>
                            <span className="hidden lg:inline text-[10px] opacity-70"> · {event.venue.name}</span>
                          </div>
                        </Link>
                      ))}
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
          // Collect all days with events, sorted
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
            const dayEvts = eventsByDay.get(day)!;

            return (
              <div key={day}>
                <div className={`mb-1 flex items-center gap-2 text-xs font-medium ${isToday ? "text-orange-600" : "text-zinc-500"}`}>
                  {isToday && <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />}
                  {dayLabel}
                  {isToday && <span className="text-[10px] font-normal">(today)</span>}
                </div>
                <div className="space-y-1.5">
                  {dayEvts.map((event) => {
                    const progress = Math.min((event._count.pledges / event.minPledges) * 100, 100);
                    return (
                      <Link
                        key={event.id}
                        href={`/events/${event.slug}`}
                        className="block rounded-lg border bg-white p-3 transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100">
                              <Music2 className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{event.band.name}</p>
                              <p className="text-xs text-zinc-500">{event.venue.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">{formatCurrency(event.ticketPrice)}</span>
                            <Badge className={`ml-2 text-[10px] ${EVENT_STATUS_COLORS[event.status]}`}>
                              {EVENT_STATUS_LABELS[event.status]}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-zinc-500">
                            <span>{event._count.pledges} / {event.minPledges} pledges</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
