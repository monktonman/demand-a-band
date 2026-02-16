import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Users,
  Sparkles,
  MapPin,
  Shield,
  ArrowRight,
  Zap,
  Sliders,
  Heart,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch featured events and stats for the landing page
  const [events, stats] = await Promise.all([
    prisma.event.findMany({
      where: { status: { in: ["PROPOSED", "THRESHOLD_MET"] } },
      include: {
        band: true,
        venue: true,
        _count: { select: { pledges: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.user.count().then(async (userCount) => {
      const bandCount = await prisma.band.count();
      const venueCount = await prisma.venue.count();
      return { userCount, bandCount, venueCount };
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        {/* Decorative gradient orbs */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-orange-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400 ring-1 ring-orange-500/20">
              <Zap className="h-4 w-4" />
              Baltimore&apos;s crowd-powered concert platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              You pick the music.{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                We make it happen.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300 sm:text-xl">
              Share your music preferences and we&apos;ll find shows for you — or
              dream up the perfect concert and rally fans to make it real.
              Either way, you only pay when enough people commit.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full bg-orange-600 text-base hover:bg-orange-700 sm:w-auto"
                >
                  Get Started — It&apos;s Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-zinc-600 bg-transparent text-base text-zinc-300 hover:bg-zinc-800 hover:text-white sm:w-auto"
                >
                  Browse Shows
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                No charge until confirmed
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-orange-500" />
                {stats.venueCount} Baltimore venues
              </div>
              <div className="flex items-center gap-1.5">
                <Music className="h-4 w-4 text-amber-500" />
                {stats.bandCount}+ artists tracked
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Ways It Works */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 bg-orange-100 text-orange-700">
              How It Works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Two ways to get the shows you want
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              No gatekeepers. No algorithms. Just real fans making shows happen.
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            {/* Path 1: Discover Shows */}
            <div className="rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                <Sliders className="h-4 w-4" />
                Discover Shows
              </div>
              <h3 className="text-2xl font-bold text-zinc-900">
                Tell us your taste, we&apos;ll find the shows
              </h3>
              <p className="mt-3 text-zinc-600">
                Share your favorite artists, genres, and where you want to see
                shows. We match you with proposed events based on fan demand in
                your market.
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Set your preferences</p>
                    <p className="text-sm text-zinc-500">
                      Pick your artists, genres, and location
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                    2
                  </div>
                  <div>
                    <p className="font-medium">We propose shows</p>
                    <p className="text-sm text-zinc-500">
                      When enough fans want the same thing, we work with venues
                      to propose a show
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Commit and go</p>
                    <p className="text-sm text-zinc-500">
                      Pledge for tickets — you only pay if enough people commit
                      and the show is confirmed
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/register">
                <Button className="mt-6 bg-orange-600 hover:bg-orange-700">
                  Set Your Preferences
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Path 2: Dream Shows */}
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                <Sparkles className="h-4 w-4" />
                Dream Shows
              </div>
              <h3 className="text-2xl font-bold text-zinc-900">
                Imagine the perfect show — then make it real
              </h3>
              <p className="mt-3 text-zinc-600">
                Pick your dream artist, choose a venue size, set a price
                signal, and share it. When enough fans say they&apos;d go,
                event planners can make it happen.
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Build your dream show</p>
                    <p className="text-sm text-zinc-500">
                      Pick an artist, a venue, and what you&apos;d pay
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Rally your friends</p>
                    <p className="text-sm text-zinc-500">
                      Share your dream show link — the more fans who opt in, the
                      more likely it happens
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Event planners take notice</p>
                    <p className="text-sm text-zinc-500">
                      Real demand data helps promoters offer the show to the
                      people who already said they&apos;d go
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/dream-show">
                <Button className="mt-6 bg-amber-600 hover:bg-amber-700">
                  Create a Dream Show
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {events.length > 0 && (
        <section className="bg-zinc-50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge className="mb-4 bg-green-100 text-green-700">
                Live Now
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Shows looking for pledges
              </h2>
              <p className="mt-4 text-lg text-zinc-600">
                These proposed shows need enough fans to go live. Pledge now to make
                them happen.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const progress = Math.min(
                  (event._count.pledges / event.minPledges) * 100,
                  100
                );
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group"
                  >
                    <Card className="transition-shadow hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 transition-colors group-hover:bg-orange-200">
                              <Music className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold group-hover:text-orange-600">
                                {event.band.name}
                              </h3>
                              <p className="text-xs text-zinc-500">
                                {event.venue.name}
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-orange-600">
                            {formatCurrency(Number(event.ticketPrice))}
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>
                              {event._count.pledges} / {event.minPledges}{" "}
                              pledges
                            </span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Link href="/events">
                <Button variant="outline" size="lg">
                  View All Shows
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why DAB */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Why fans love Demand A Band
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Zero Risk",
                description:
                  "You only pay if the show is confirmed. No show, no charge. Ever.",
              },
              {
                icon: Users,
                title: "Fan-Powered",
                description:
                  "No more waiting for promoters. You tell us what you want, and real demand makes it happen.",
              },
              {
                icon: Heart,
                title: "Personalized",
                description:
                  "Set your artists, genres, and location — we match you with shows you actually want to see.",
              },
              {
                icon: Sparkles,
                title: "Dream Big",
                description:
                  "Imagine any artist at any venue. Build a dream show, rally fans, and watch it come to life.",
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <feature.icon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Ready to demand your next favorite show?
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Join {stats.userCount > 1 ? `${stats.userCount} fans` : "fans"} already shaping Baltimore&apos;s live music scene.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="mt-6 bg-orange-600 text-base hover:bg-orange-700"
            >
              Join Demand A Band
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
