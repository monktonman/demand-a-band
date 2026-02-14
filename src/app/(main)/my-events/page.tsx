import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/events/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Ticket, Music2, MapPin, Calendar, Users, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PLEDGE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  CHARGED: "bg-green-600 text-white",
  PAYMENT_FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-zinc-100 text-zinc-800",
};

const PLEDGE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Pledged",
  CHARGED: "Ticket Secured",
  PAYMENT_FAILED: "Payment Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const EVENT_STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Gathering Pledges",
  THRESHOLD_MET: "Threshold Met!",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const EVENT_STATUS_COLORS: Record<string, string> = {
  PROPOSED: "bg-blue-100 text-blue-700",
  THRESHOLD_MET: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-zinc-100 text-zinc-700",
};

export default async function MyEventsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const pledges = await prisma.pledge.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        include: {
          band: true,
          venue: true,
          _count: { select: { pledges: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activePledges = pledges.filter((p) => p.status === "ACTIVE" || p.status === "CHARGED");
  const pastPledges = pledges.filter((p) => p.status === "CANCELLED" || p.status === "REFUNDED" || p.status === "PAYMENT_FAILED");

  const totalPledged = pledges.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  const totalTickets = pledges
    .filter((p) => p.status === "ACTIVE" || p.status === "CHARGED")
    .reduce((sum, p) => sum + p.quantity, 0);

  // Also get events the user might be interested in (based on band preferences)
  const userBandIds = await prisma.userBandPreference.findMany({
    where: { userId: session.user.id },
    select: { bandId: true },
  });
  const bandIds = userBandIds.map((b) => b.bandId);
  const pledgedEventIds = pledges.map((p) => p.eventId);

  const suggestedEvents = bandIds.length > 0
    ? await prisma.event.findMany({
        where: {
          bandId: { in: bandIds },
          id: { notIn: pledgedEventIds },
          status: { in: ["PROPOSED", "THRESHOLD_MET"] },
        },
        include: {
          band: true,
          venue: true,
          _count: { select: { pledges: true } },
        },
        take: 3,
      })
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Events</h1>
        <p className="mt-1 text-zinc-500">
          Track your pledged events and discover new shows
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Ticket className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">{activePledges.length}</p>
              <p className="text-xs text-zinc-500">Active Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{totalTickets}</p>
              <p className="text-xs text-zinc-500">Total Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Music2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalPledged)}</p>
              <p className="text-xs text-zinc-500">Total Pledged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Pledges */}
      {activePledges.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
            <Ticket className="h-5 w-5 text-orange-600" />
            Active Pledges
          </h2>
          <div className="space-y-4">
            {activePledges.map((pledge) => {
              const pledgeCount = pledge.event._count.pledges;
              const progress = Math.min(
                (pledgeCount / pledge.event.minPledges) * 100,
                100
              );
              const daysUntilEvent = Math.ceil(
                (new Date(pledge.event.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const daysUntilDeadline = Math.ceil(
                (new Date(pledge.event.pledgeDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Link
                  key={pledge.id}
                  href={`/events/${pledge.event.slug}`}
                  className="block"
                >
                  <Card className="transition-all hover:shadow-lg hover:border-orange-200">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Band icon */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                          <Music2 className="h-7 w-7 text-orange-600" />
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-bold">
                                {pledge.event.band.name}
                              </h3>
                              <p className="text-sm text-zinc-500">
                                at {pledge.event.venue.name}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={PLEDGE_STATUS_COLORS[pledge.status]}>
                                {PLEDGE_STATUS_LABELS[pledge.status]}
                              </Badge>
                              <Badge className={EVENT_STATUS_COLORS[pledge.event.status]}>
                                {EVENT_STATUS_LABELS[pledge.event.status]}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-600">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-zinc-400" />
                              {formatDate(pledge.event.eventDate)}
                              {daysUntilEvent > 0 && (
                                <span className="text-xs text-zinc-400">
                                  ({daysUntilEvent} days)
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-zinc-400" />
                              {pledge.event.venue.city}, {pledge.event.venue.state}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Ticket className="h-4 w-4 text-zinc-400" />
                              {pledge.quantity} {pledge.quantity === 1 ? "ticket" : "tickets"} · {formatCurrency(Number(pledge.totalAmount))}
                            </span>
                            {daysUntilDeadline > 0 && pledge.event.status === "PROPOSED" && (
                              <span className="flex items-center gap-1.5 text-amber-600">
                                <Clock className="h-4 w-4" />
                                {daysUntilDeadline} days to deadline
                              </span>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="flex items-center gap-1 text-zinc-400">
                                <Users className="h-3 w-3" />
                                {pledgeCount} / {pledge.event.minPledges} pledges needed
                              </span>
                              <span className={`font-medium ${progress >= 100 ? "text-green-600" : "text-orange-600"}`}>
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Past / Inactive Pledges */}
      {pastPledges.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-bold flex items-center gap-2 text-zinc-500">
            Past Pledges
          </h2>
          <div className="space-y-2">
            {pastPledges.map((pledge) => (
              <div
                key={pledge.id}
                className="flex items-center gap-4 rounded-lg border border-zinc-100 bg-zinc-50 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200">
                  <Music2 className="h-5 w-5 text-zinc-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-600">{pledge.event.band.name}</p>
                  <p className="text-xs text-zinc-400">
                    {pledge.event.venue.name} · {formatDate(pledge.event.eventDate)}
                  </p>
                </div>
                <Badge className={PLEDGE_STATUS_COLORS[pledge.status]}>
                  {PLEDGE_STATUS_LABELS[pledge.status]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Events */}
      {suggestedEvents.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
            <Music2 className="h-5 w-5 text-orange-600" />
            Recommended For You
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Based on your band preferences
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pledges.length === 0 && (
        <div className="py-16 text-center">
          <Ticket className="mx-auto mb-4 h-16 w-16 text-zinc-200" />
          <h2 className="text-2xl font-bold text-zinc-700">No events yet</h2>
          <p className="mt-2 text-zinc-500 max-w-md mx-auto">
            Browse upcoming events and pledge your support to make shows happen in Baltimore!
          </p>
          <Link href="/events">
            <Button className="mt-6 bg-orange-600 hover:bg-orange-700" size="lg">
              Browse Events
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
