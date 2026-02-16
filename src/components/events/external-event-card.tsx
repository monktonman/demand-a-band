"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Music2, ExternalLink, Sparkles } from "lucide-react";

export interface ExternalEventData {
  id: string;
  externalId: string;
  name: string;
  artistName: string;
  genres: string[];
  venueName: string;
  venueCity: string;
  venueState: string;
  eventDate: string; // ISO string
  eventTime: string | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  priceMin: string | null;
  priceMax: string | null;
  source: string;
}

interface ExternalEventCardProps {
  event: ExternalEventData;
  matchesPreferences?: boolean;
}

function formatPrice(min: string | null, max: string | null): string {
  if (!min && !max) return "Check site for price";
  const minNum = min ? Number(min) : null;
  const maxNum = max ? Number(max) : null;
  if (minNum && maxNum && minNum !== maxNum) {
    return `$${Math.round(minNum)}–$${Math.round(maxNum)}`;
  }
  if (minNum) return `From $${Math.round(minNum)}`;
  if (maxNum) return `Up to $${Math.round(maxNum)}`;
  return "Check site for price";
}

function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ExternalEventCard({
  event,
  matchesPreferences,
}: ExternalEventCardProps) {
  return (
    <Card className="group h-full transition-shadow hover:shadow-lg">
      {/* Artist header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {event.imageUrl ? (
              <div className="h-12 w-12 overflow-hidden rounded-lg">
                <img
                  src={event.imageUrl}
                  alt={event.artistName}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Music2 className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold truncate group-hover:text-blue-600">
                {event.artistName}
              </h3>
              <p className="text-xs text-zinc-500 truncate">
                {event.genres.slice(0, 2).join(" / ") || "Music"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {matchesPreferences && (
              <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px]">
                <Sparkles className="mr-0.5 h-3 w-3" />
                Match
              </Badge>
            )}
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
              Confirmed
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Venue & Date */}
        <div className="space-y-1.5 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {event.venueName} — {event.venueCity}, {event.venueState}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>
              {formatEventDate(event.eventDate)}
              {event.eventTime && (
                <span className="text-zinc-400"> · {event.eventTime}</span>
              )}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-zinc-900">
            {formatPrice(event.priceMin, event.priceMax)}
          </span>
        </div>
      </CardContent>

      <CardFooter>
        {event.ticketUrl ? (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Buy Tickets
            </Button>
          </a>
        ) : (
          <Button
            className="w-full bg-zinc-200 text-zinc-600 cursor-default"
            size="sm"
            disabled
          >
            Tickets Not Yet Available
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
