import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Heart, Music2, MapPin, Calendar } from "lucide-react";
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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [pledges, bandPrefs, cityPrefs] = await Promise.all([
    prisma.pledge.findMany({
      where: { userId: session.user.id },
      include: {
        event: {
          include: { band: true, venue: true },
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
  ]);

  const activePledges = pledges.filter(
    (p) => p.status === "ACTIVE"
  );
  const dreamShows = bandPrefs.filter((p) => p.isDreamShow);

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
              <p className="text-xs text-zinc-500">Band Preferences</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Music2 className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold">{dreamShows.length}</p>
              <p className="text-xs text-zinc-500">Dream Shows</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{cityPrefs.length}</p>
              <p className="text-xs text-zinc-500">Cities</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* My Pledges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-600" />
              My Pledges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pledges.length > 0 ? (
              <div className="space-y-3">
                {pledges.slice(0, 5).map((pledge) => (
                  <div
                    key={pledge.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{pledge.event.band.name}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <MapPin className="h-3 w-3" />
                        {pledge.event.venue.name}
                        <Calendar className="h-3 w-3 ml-1" />
                        {formatDate(pledge.event.eventDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={PLEDGE_STATUS_COLORS[pledge.status]}>
                        {pledge.status.toLowerCase()}
                      </Badge>
                      <p className="mt-1 text-sm font-medium">
                        {formatCurrency(Number(pledge.totalAmount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-zinc-400">
                <Ticket className="mx-auto mb-2 h-8 w-8" />
                <p>No pledges yet</p>
                <Link href="/events">
                  <Button variant="link" className="mt-1 text-orange-600">
                    Browse events
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Band Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                My Band Preferences
              </CardTitle>
              <Link href="/onboarding">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {bandPrefs.length > 0 ? (
              <div className="space-y-2">
                {bandPrefs.slice(0, 8).map((pref) => (
                  <div
                    key={pref.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pref.band.name}</span>
                      {pref.isDreamShow && (
                        <Badge className="bg-amber-500 text-xs">Dream</Badge>
                      )}
                    </div>
                    <span className="text-sm text-zinc-500">
                      up to {formatCurrency(Number(pref.maxTicketPrice))}
                    </span>
                  </div>
                ))}
                {bandPrefs.length > 8 && (
                  <p className="pt-1 text-center text-xs text-zinc-400">
                    + {bandPrefs.length - 8} more
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-zinc-400">
                <Heart className="mx-auto mb-2 h-8 w-8" />
                <p>No preferences set</p>
                <Link href="/onboarding">
                  <Button variant="link" className="mt-1 text-orange-600">
                    Set up preferences
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
