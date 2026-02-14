import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CalendarRange,
  MapPin,
  Users,
  Music2,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateRange, formatTime } from "@/lib/utils";
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from "@/lib/constants";
import { PledgeButton } from "@/components/events/pledge-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await getServerSession(authOptions);

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      band: true,
      venue: true,
      _count: { select: { pledges: true } },
    },
  });

  if (!event) {
    notFound();
  }

  const ticketPrice = Number(event.ticketPrice);
  const serviceFee = Number(event.serviceFee);
  const totalPrice = ticketPrice + serviceFee;
  const pledgeCount = event._count.pledges;
  const progress = Math.min(
    (pledgeCount / event.minPledges) * 100,
    100
  );
  const remainingPledges = Math.max(event.minPledges - pledgeCount, 0);
  const isAcceptingPledges =
    (event.status === "PROPOSED" || event.status === "THRESHOLD_MET") &&
    new Date() < event.pledgeDeadline;

  // Check if user has already pledged
  let userHasPledged = false;
  if (session?.user?.id) {
    const existingPledge = await prisma.pledge.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: event.id,
        },
      },
    });
    userHasPledged = !!existingPledge;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 md:col-span-2">
          {/* Header */}
          <div>
            <Badge
              className={EVENT_STATUS_COLORS[event.status] || "bg-zinc-500"}
            >
              {EVENT_STATUS_LABELS[event.status] || event.status}
            </Badge>
            <h1 className="mt-3 text-3xl font-bold">{event.title}</h1>
            {event.description && (
              <p className="mt-2 text-zinc-600">{event.description}</p>
            )}
          </div>

          {/* Band info */}
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100">
                <Music2 className="h-7 w-7 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{event.band.name}</h2>
                <p className="text-sm text-zinc-500">
                  {event.band.genres.join(" / ")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Venue & Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Venue & Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium">{event.venue.name}</p>
                  <p className="text-sm text-zinc-500">
                    {event.venue.address}, {event.venue.city},{" "}
                    {event.venue.state} {event.venue.zipCode}
                  </p>
                  <p className="text-sm text-zinc-400">
                    Capacity: {event.venue.capacity.toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Date window or confirmed date */}
              {event.windowStart && event.windowEnd && event.status !== "CONFIRMED" && event.status !== "COMPLETED" ? (
                <div className="flex items-start gap-3">
                  <CalendarRange className="mt-0.5 h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-orange-700">
                      Availability Window
                    </p>
                    <p className="text-sm font-medium">
                      {formatDateRange(event.windowStart, event.windowEnd)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Target date: {formatDate(event.eventDate)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Exact date confirmed once the show is locked in
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="font-medium">{formatDate(event.eventDate)}</p>
                    {event.doorsTime && (
                      <p className="text-sm text-zinc-500">
                        Doors: {formatTime(event.doorsTime)}
                      </p>
                    )}
                    {event.showTime && (
                      <p className="text-sm text-zinc-500">
                        Show: {formatTime(event.showTime)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium">Pledge Deadline</p>
                  <p className="text-sm text-zinc-500">
                    {formatDate(event.pledgeDeadline)} at{" "}
                    {formatTime(event.pledgeDeadline)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Pledge CTA */}
        <div className="space-y-4">
          <Card className="sticky top-24 border-orange-200">
            <CardContent className="space-y-4 p-6">
              {/* Price */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">
                    {formatCurrency(ticketPrice)}
                  </span>
                  <span className="text-zinc-400">/ ticket</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  + {formatCurrency(serviceFee)} service fee ={" "}
                  <span className="font-medium">
                    {formatCurrency(totalPrice)}
                  </span>{" "}
                  total
                </p>
              </div>

              <Separator />

              {/* Pledge progress */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-zinc-600">
                    <Users className="h-4 w-4" />
                    {pledgeCount} pledges
                  </span>
                  <span className="font-semibold text-orange-600">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="mt-2 text-xs text-zinc-400">
                  {remainingPledges > 0 ? (
                    <>
                      <span className="font-medium text-zinc-600">
                        {remainingPledges}
                      </span>{" "}
                      more pledges needed to confirm
                    </>
                  ) : (
                    <span className="font-medium text-green-600">
                      Minimum pledges reached!
                    </span>
                  )}
                </p>
              </div>

              <Separator />

              {/* CTA */}
              <div className="space-y-2">
                <PledgeButton
                  eventId={event.id}
                  ticketPrice={ticketPrice}
                  serviceFee={serviceFee}
                  maxCapacity={event.maxCapacity}
                  currentPledges={pledgeCount}
                  isAcceptingPledges={isAcceptingPledges}
                  userHasPledged={userHasPledged}
                />
                <p className="text-center text-xs text-zinc-400">
                  You&apos;ll only be charged if the show is confirmed.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
