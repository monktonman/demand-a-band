import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/events/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Ticket,
  Music2,
  MapPin,
  Calendar,
  Users,
  Clock,
  Sparkles,
  Heart,
  DollarSign,
  Share2,
  ArrowRight,
  Sliders,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { MyShowsTour } from "@/components/shared/my-shows-tour";

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

  const [pledges, dreamShows, bandPrefs, genrePrefs, cityPrefs] = await Promise.all([
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
    prisma.dreamShow.findMany({
      where: { creatorId: session.user.id },
      include: {
        band: true,
        venue: true,
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userBandPreference.findMany({
      where: { userId: session.user.id },
      include: { band: true },
      orderBy: { priority: "asc" },
    }),
    prisma.userGenrePreference.findMany({
      where: { userId: session.user.id },
    }),
    prisma.userCityPreference.findMany({
      where: { userId: session.user.id },
    }),
  ]);

  const activePledges = pledges.filter((p) => p.status === "ACTIVE" || p.status === "CHARGED");
  const pastPledges = pledges.filter((p) => p.status === "CANCELLED" || p.status === "REFUNDED" || p.status === "PAYMENT_FAILED");

  const totalPledged = pledges.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  const totalTickets = pledges
    .filter((p) => p.status === "ACTIVE" || p.status === "CHARGED")
    .reduce((sum, p) => sum + p.quantity, 0);

  // Get recommended events based on artist preferences
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
        <h1 className="text-3xl font-bold">
          Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-zinc-500">
          Your shows, preferences, and recommendations
        </p>
      </div>

      {/* First-time user guidance */}
      <MyShowsTour
        userId={session.user.id}
        hasPreferences={bandPrefs.length > 0 || genrePrefs.length > 0 || cityPrefs.length > 0}
        hasPledges={pledges.length > 0}
      />

      {/* Stats */}
      <div data-tour="my-shows-stats" className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Ticket className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">{activePledges.length}</p>
              <p className="text-xs text-zinc-500">Active Shows</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Sparkles className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{dreamShows.length}</p>
              <p className="text-xs text-zinc-500">Dream Shows</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Heart className="h-8 w-8 text-pink-600" />
            <div>
              <p className="text-2xl font-bold">{bandPrefs.length}</p>
              <p className="text-xs text-zinc-500">Artists</p>
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
                        {/* Artist icon */}
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

      {/* My Dream Shows */}
      <div data-tour="my-shows-dream" className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            My Dream Shows
          </h2>
          <Link href="/dream-show">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Create New
            </Button>
          </Link>
        </div>

        {dreamShows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dreamShows.map((ds) => (
              <Link
                key={ds.id}
                href={`/dream-show/${ds.shareCode}`}
                className="block"
              >
                <Card className="h-full transition-all hover:shadow-lg hover:border-amber-200">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                        <Music2 className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold truncate">{ds.band.name}</h3>
                        {ds.band.genres.length > 0 && (
                          <p className="text-xs text-zinc-400 truncate">
                            {ds.band.genres.slice(0, 3).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {ds.venueSizeLabel && (
                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{ds.venueSizeLabel}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                        <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{ds.priceTierLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Created {formatDate(ds.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span className="text-sm font-medium">
                          {ds._count.votes} {ds._count.votes === 1 ? "fan" : "fans"} want this
                        </span>
                      </div>
                      <Share2 className="h-4 w-4 text-zinc-300" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-zinc-200 bg-zinc-50/50">
            <CardContent className="py-8 text-center">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="font-medium text-zinc-600">No dream shows yet</p>
              <p className="mt-1 text-sm text-zinc-400">
                Dream up your perfect show — pick an artist, venue size, and price.
              </p>
              <Link href="/dream-show">
                <Button className="mt-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700" size="sm">
                  Build a Dream Show
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Preferences — consolidated from Dashboard */}
      <div data-tour="my-shows-preferences" className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sliders className="h-5 w-5 text-purple-600" />
            My Preferences
          </h2>
          <Link href="/preferences">
            <Button variant="outline" size="sm">
              Edit Preferences
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Artists & Genres */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Music2 className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-sm">My Music</h3>
              </div>
              {bandPrefs.length > 0 || genrePrefs.length > 0 ? (
                <div className="space-y-3">
                  {/* Genre chips */}
                  {genrePrefs.length > 0 && (
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Genres ({genrePrefs.length})
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                  {/* Artist list */}
                  {bandPrefs.length > 0 && (
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Artists ({bandPrefs.length})
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {bandPrefs.slice(0, 12).map((pref) => (
                          <Badge
                            key={pref.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {pref.band.name}
                            {pref.isDreamShow && (
                              <Sparkles className="ml-1 h-2.5 w-2.5 text-amber-500" />
                            )}
                          </Badge>
                        ))}
                        {bandPrefs.length > 12 && (
                          <Badge variant="outline" className="text-xs text-zinc-400">
                            +{bandPrefs.length - 12} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-zinc-400">
                  <Music2 className="mx-auto mb-2 h-6 w-6" />
                  <p className="text-sm">No music preferences set</p>
                  <Link href="/preferences">
                    <Button variant="link" size="sm" className="mt-1 text-orange-600">
                      Set up preferences
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm">My Locations</h3>
              </div>
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
                <div className="text-center py-4 text-zinc-400">
                  <MapPin className="mx-auto mb-2 h-6 w-6" />
                  <p className="text-sm">No cities set</p>
                  <Link href="/preferences">
                    <Button variant="link" size="sm" className="mt-1 text-orange-600">
                      Add cities
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
            Based on your artist preferences
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state — only show if no pledges AND no dream shows */}
      {pledges.length === 0 && dreamShows.length === 0 && (
        <div className="py-16 text-center">
          <Ticket className="mx-auto mb-4 h-16 w-16 text-zinc-200" />
          <h2 className="text-2xl font-bold text-zinc-700">No shows yet</h2>
          <p className="mt-2 text-zinc-500 max-w-md mx-auto">
            Browse proposed shows and pledge your support, or dream up the perfect show and rally your friends!
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/events">
              <Button className="bg-orange-600 hover:bg-orange-700" size="lg">
                Browse Shows
              </Button>
            </Link>
            <Link href="/dream-show">
              <Button variant="outline" size="lg" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                Build a Dream Show
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
