import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarRange, MapPin, Users, Music2 } from "lucide-react";
import { formatCurrency, formatDate, formatDateRange } from "@/lib/utils";
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from "@/lib/constants";
import type { Band, Venue, EventStatus } from "@prisma/client";

interface EventCardProps {
  event: {
    id: string;
    slug: string;
    title: string;
    status: EventStatus;
    windowStart?: Date | null;
    windowEnd?: Date | null;
    eventDate: Date;
    ticketPrice: unknown; // Prisma Decimal
    serviceFee: unknown;
    minPledges: number;
    maxCapacity: number;
    band: Band;
    venue: Venue;
    ticketCount?: number;
    _count: { pledges: number };
  };
}

export function EventCard({ event }: EventCardProps) {
  const pledgeCount = event.ticketCount ?? event._count.pledges;
  const progress = Math.min(
    (pledgeCount / event.minPledges) * 100,
    100
  );
  const ticketPrice = Number(event.ticketPrice);
  const serviceFee = Number(event.serviceFee);
  const hasWindow = event.windowStart && event.windowEnd;
  const isConfirmed = event.status === "CONFIRMED" || event.status === "COMPLETED";

  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="group h-full transition-shadow hover:shadow-lg">
        {/* Band header area */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Music2 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-orange-600">
                  {event.band.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  {event.band.genres.slice(0, 2).join(" / ")}
                </p>
              </div>
            </div>
            <Badge className={EVENT_STATUS_COLORS[event.status] || "bg-zinc-500"}>
              {EVENT_STATUS_LABELS[event.status] || event.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Venue & Date */}
          <div className="space-y-1.5 text-sm text-zinc-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                {event.venue.name} - {event.venue.city}, {event.venue.state}
              </span>
            </div>
            {hasWindow && !isConfirmed ? (
              <div className="flex items-center gap-2">
                <CalendarRange className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-orange-700 font-medium text-xs">
                  {formatDateRange(event.windowStart!, event.windowEnd!)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span>{formatDate(event.eventDate)}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-zinc-900">
              {formatCurrency(ticketPrice)}
            </span>
            <span className="text-sm text-zinc-400">
              + {formatCurrency(serviceFee)} fee
            </span>
          </div>

          {/* Pledge progress */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-zinc-500">
                <Users className="h-3 w-3" />
                {pledgeCount} / {event.minPledges} pledges
              </span>
              <span className="font-medium text-orange-600">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="sm"
          >
            Pledge Now
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
