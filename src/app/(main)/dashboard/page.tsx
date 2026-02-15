import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Ticket, Heart, Music2, MapPin, Calendar, Users, ExternalLink, Sliders } from "lucide-react";
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
  CHARGED: "Charged",
  PAYMENT_FAILED: "Payment Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [pledges, bandPrefs, cityPrefs, genrePrefs] = await Promise.all([
    prisma.pledge.findMany({
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
    }),
    prisma.userBandPreference.findMany({
      where: { userId: session.user.id },
      include: { band: true },
      orderBy: { priority: "asc" },
    }),
    prisma.userCityPreference.findMany({
      where: { userId: session.user.id },
    }),
    prisma.userGenrePreference.findMany({
      where: { userId: session.user.id },
    }),
  ]);

  const activePledges = pledges.filter((p) => p.status === "ACTIVE");
  const totalPledged = pledges.reduce(
    (sum, p) => sum + Number(p.totalAmount),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-zinc-500">
          Manage your pledges and preferences
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Ticket className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">{activePledges.length}</p>
              <p className="text-xs text-zinc-500">Active Pledges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Heart className="h-8 w-8 text-pink-600" />
            <div>
              <p className="text-2xl font-bold">{bandPrefs.length}</p>
              <p className="text-xs text-zinc-500">Bands</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Sliders className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{genrePrefs.length}</p>
              <p className="text-xs text-zinc-500">Genres</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">
                {totalPledged > 0 ? formatCurrency(totalPledged) : "$0"}
              </p>
              <p className="text-xs text-zinc-500">Total Pledged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Pledges — Full Width */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-600" />
              My Pledges
            </CardTitle>
            <Link href="/my-events">
              <Button variant="outline" size="sm" className="gap-1">
                View All
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pledges.length > 0 ? (
            <div className="space-y-3">
              {pledges.map((pledge) => {
                const pledgeCount = pledge.event._count.pledges;
                const progress = Math.min(
                  (pledgeCount / pledge.event.minPledges) * 100,
                  100
                );
                return (
                  <Link
                    key={pledge.id}
                    href={`/events/${pledge.event.slug}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 rounded-lg border p-4 transition-all hover:shadow-md hover:border-orange-200">
                      {/* Band icon */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                        <Music2 className="h-6 w-6 text-orange-600" />
                      </div>

                      {/* Event details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {pledge.event.band.name}
                          </h3>
                          <Badge className={PLEDGE_STATUS_COLORS[pledge.status]}>
                            {PLEDGE_STATUS_LABELS[pledge.status] || pledge.status}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {pledge.event.venue.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(pledge.event.eventDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            {pledge.quantity} {pledge.quantity === 1 ? "ticket" : "tickets"}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Users className="h-3 w-3" />
                              {pledgeCount} / {pledge.event.minPledges} pledges
                            </span>
                            <span className="font-medium text-orange-600">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold text-zinc-900">
                          {formatCurrency(Number(pledge.totalAmount))}
                        </p>
                        <p className="text-xs text-zinc-400">pledged</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-400">
              <Ticket className="mx-auto mb-3 h-10 w-10" />
              <p className="text-lg font-medium text-zinc-600">No pledges yet</p>
              <p className="mt-1 text-sm">
                Browse events and pledge your support to make shows happen!
              </p>
              <Link href="/events">
                <Button className="mt-4 bg-orange-600 hover:bg-orange-700">
                  Browse Events
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom row — Preferences */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* My Music (Bands & Genres) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-orange-600" />
                My Music
              </CardTitle>
              <Link href="/preferences">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {bandPrefs.length > 0 || genrePrefs.length > 0 ? (
              <div className="space-y-4">
                {/* Genre chips */}
                {genrePrefs.length > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Genres ({genrePrefs.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {genrePrefs.map((pref) => (
                        <Badge
                          key={pref.id}
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 text-xs"
                        >
                          {pref.genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Band list */}
                {bandPrefs.length > 0 && (
                  <div>
                    {genrePrefs.length > 0 && (
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          Bands ({bandPrefs.length})
                        </span>
                      </div>
                    )}
                    <div className="space-y-2">
                      {bandPrefs.slice(0, 8).map((pref) => (
                        <div
                          key={pref.id}
                          className="flex items-center justify-between rounded-lg border p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-50">
                              <Music2 className="h-4 w-4 text-orange-500" />
                            </div>
                            <span className="font-medium text-sm">{pref.band.name}</span>
                            {pref.isDreamShow && (
                              <Badge className="bg-amber-500 text-xs">Dream</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {bandPrefs.length > 8 && (
                        <p className="pt-1 text-center text-xs text-zinc-400">
                          + {bandPrefs.length - 8} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-zinc-400">
                <Music2 className="mx-auto mb-2 h-8 w-8" />
                <p>No music preferences set</p>
                <Link href="/preferences">
                  <Button variant="link" className="mt-1 text-orange-600">
                    Set up preferences
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* City Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                My Locations
              </CardTitle>
              <Link href="/preferences">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {cityPrefs.length > 0 ? (
              <div className="space-y-2">
                {cityPrefs.map((pref) => (
                  <div
                    key={pref.id}
                    className="flex items-center justify-between rounded-lg border p-2.5"
                  >
                    <span className="font-medium text-sm">
                      {pref.city}, {pref.state}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {pref.maxRadius} mi radius
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-zinc-400">
                <MapPin className="mx-auto mb-2 h-8 w-8" />
                <p>No cities set</p>
                <Link href="/preferences">
                  <Button variant="link" className="mt-1 text-orange-600">
                    Add cities
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
