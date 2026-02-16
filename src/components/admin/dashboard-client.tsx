"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  Music2,
  MapPin,
  Calendar,
  Ticket,
  TrendingUp,
  Sparkles,
  DollarSign,
  ArrowUpRight,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface DashboardProps {
  stats: {
    userCount: number;
    bandCount: number;
    venueCount: number;
    eventCount: number;
    pledgeCount: number;
    preferenceCount: number;
    dreamShowCount: number;
  };
  topBands: Array<{
    id: string;
    name: string;
    genres: string[];
    demandCount: number;
    avgPrice: number;
    maxPrice: number;
    dreamShowCount: number;
    dreamShowAvgPrice: number;
  }>;
  dreamShows: Array<{
    id: string;
    name: string;
    genres: string[];
    fanCount: number;
    avgPrice: number;
    maxPrice: number;
    minPrice: number;
    totalRevenuePotential: number;
  }>;
  cityDemand: Array<{
    city: string;
    state: string;
    fanCount: number;
  }>;
  genreDemand: Array<{
    genre: string;
    fanCount: number;
    bandCount: number;
    totalBandDemand: number;
  }>;
}

const CHART_COLORS = [
  "#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa",
  "#a3a3a3", "#d4d4d4",
];

function buildPromoteUrl(band: { id: string; name: string; avgPrice: number; demandCount: number; dreamShowCount: number }) {
  return `/admin/events/new?bandId=${band.id}&bandName=${encodeURIComponent(band.name)}&avgPrice=${Math.round(band.avgPrice)}&demandCount=${band.demandCount}&dreamShowCount=${band.dreamShowCount}`;
}

export function AdminDashboardClient({
  stats,
  topBands,
  dreamShows,
  cityDemand,
  genreDemand,
}: DashboardProps) {
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Genre chart data — top 12
  const genreChartData = genreDemand.slice(0, 12).map((g) => ({
    name: g.genre,
    fans: g.fanCount,
    bandDemand: g.totalBandDemand,
    total: g.fanCount + g.totalBandDemand,
  }));

  // Bands filtered by selected genre
  const filteredBands = selectedGenre
    ? topBands.filter((b) => b.genres.includes(selectedGenre))
    : [];

  // Data for top bands chart
  const topBandsChartData = topBands.slice(0, 10).map((band) => ({
    name: band.name.length > 15 ? band.name.slice(0, 15) + "..." : band.name,
    fullName: band.name,
    fans: band.demandCount,
    dreamShows: band.dreamShowCount,
    id: band.id,
    avgPrice: band.avgPrice,
    dreamShowCount: band.dreamShowCount,
  }));

  // Data for city demand chart
  const cityChartData = cityDemand.slice(0, 8).map((c) => ({
    name: `${c.city}, ${c.state}`,
    fans: c.fanCount,
  }));

  function handleGenreClick(genre: string) {
    setSelectedGenre((prev) => (prev === genre ? null : genre));
  }

  function handleBandBarClick(_data: unknown, index: number) {
    const band = topBands[index];
    if (band) {
      router.push(buildPromoteUrl(band));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500">
          Platform overview and demand analytics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Users</p>
                <p className="text-2xl font-bold">{stats.userCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Demand Signals</p>
                <p className="text-2xl font-bold">{stats.preferenceCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Dream Shows</p>
                <p className="text-2xl font-bold">{stats.dreamShowCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Ticket className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Pledges</p>
                <p className="text-2xl font-bold">{stats.pledgeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Music2 className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-sm text-zinc-500">Bands</p>
              <p className="text-lg font-semibold">{stats.bandCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-sm text-zinc-500">Venues</p>
              <p className="text-lg font-semibold">{stats.venueCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-sm text-zinc-500">Events</p>
              <p className="text-lg font-semibold">{stats.eventCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Genre Demand Section — Always visible above tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Genre Demand
          </CardTitle>
          <CardDescription>
            Click a genre to see bands and create events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {genreChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={genreChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "fans" ? "Direct Fan Demand" : "Band Demand",
                    ]}
                  />
                  <Bar
                    dataKey="total"
                    name="Total Demand"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(data) => data?.name && handleGenreClick(data.name as string)}
                  >
                    {genreChartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.name === selectedGenre ? "#ea580c" : "#fdba74"}
                        stroke={entry.name === selectedGenre ? "#c2410c" : "transparent"}
                        strokeWidth={entry.name === selectedGenre ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Genre Chips */}
              <div className="flex flex-wrap gap-2">
                {genreDemand.slice(0, 20).map((g) => (
                  <button
                    key={g.genre}
                    onClick={() => handleGenreClick(g.genre)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      selectedGenre === g.genre
                        ? "bg-orange-600 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-orange-100 hover:text-orange-700"
                    }`}
                  >
                    {g.genre}
                    <span className="ml-1 text-xs opacity-75">
                      ({g.fanCount + g.totalBandDemand})
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-zinc-400">
              No genre demand data yet. Users need to complete onboarding.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Genre Drill-Down Panel */}
      {selectedGenre && (
        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">
                {selectedGenre}
              </CardTitle>
              <CardDescription>
                {filteredBands.length} band{filteredBands.length !== 1 ? "s" : ""} with demand
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedGenre(null)}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {filteredBands.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Band</TableHead>
                    <TableHead>Genres</TableHead>
                    <TableHead className="text-right">Fans</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Max Price</TableHead>
                    <TableHead className="text-right">Dream Shows</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBands.map((band) => (
                    <TableRow key={band.id}>
                      <TableCell className="font-medium">{band.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {band.genres.slice(0, 2).map((g) => (
                            <Badge key={g} variant="outline" className="text-xs">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{band.demandCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(band.avgPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(band.maxPrice)}</TableCell>
                      <TableCell className="text-right">
                        {band.dreamShowCount > 0 ? (
                          <Badge className="bg-amber-500">{band.dreamShowCount}</Badge>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={buildPromoteUrl(band)}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                            Create Event
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-zinc-400">
                No bands with demand in this genre among the top 25.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="bands" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bands">Top Bands</TabsTrigger>
          <TabsTrigger value="dreamshows">Dream Shows</TabsTrigger>
          <TabsTrigger value="cities">By City</TabsTrigger>
        </TabsList>

        {/* Top Bands Tab */}
        <TabsContent value="bands" className="space-y-4">
          {/* Top Bands Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Most Demanded Bands</CardTitle>
              <CardDescription>
                Click a bar to start creating an event for that band
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topBandsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topBandsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="fans"
                      name="Fans"
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(data, index) => handleBandBarClick(data, index)}
                    >
                      {topBandsChartData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-zinc-400">
                  No demand data yet. Users need to complete onboarding.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Bands Table */}
          <Card>
            <CardHeader>
              <CardTitle>Demand Details</CardTitle>
              <CardDescription>
                Detailed demand signals including pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Band</TableHead>
                    <TableHead>Genres</TableHead>
                    <TableHead className="text-right">Fans</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Max Price</TableHead>
                    <TableHead className="text-right">Dream Shows</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topBands.length > 0 ? (
                    topBands.map((band) => (
                      <TableRow key={band.id}>
                        <TableCell className="font-medium">
                          {band.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {band.genres.slice(0, 2).map((g) => (
                              <Badge key={g} variant="outline" className="text-xs">
                                {g}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {band.demandCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(band.avgPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(band.maxPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {band.dreamShowCount > 0 ? (
                            <Badge className="bg-amber-500">
                              {band.dreamShowCount}
                            </Badge>
                          ) : (
                            <span className="text-zinc-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={buildPromoteUrl(band)}>
                            <Button size="sm" variant="outline" className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700">
                              <ArrowUpRight className="h-3 w-3" />
                              Create Event
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-zinc-400">
                        No demand data yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dream Shows Tab */}
        <TabsContent value="dreamshows" className="space-y-4">
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Sparkles className="h-5 w-5" />
                Dream Show Demand Signals
              </CardTitle>
              <CardDescription className="text-amber-700">
                Premium intimate experiences — fans who would pay top dollar to
                see major acts in small venues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dreamShows.length > 0 ? (
                <div className="space-y-3">
                  {dreamShows.map((show) => (
                    <Card key={show.id} className="border-amber-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{show.name}</h3>
                          <p className="text-sm text-zinc-500">
                            {show.genres.join(" / ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-amber-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-lg font-bold">
                              {formatCurrency(show.totalRevenuePotential)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">
                            revenue potential
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold">{show.fanCount}</p>
                          <p className="text-xs text-zinc-500">fans</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">
                            {formatCurrency(show.avgPrice)}
                          </p>
                          <p className="text-xs text-zinc-500">avg price</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">
                            {formatCurrency(show.maxPrice)}
                          </p>
                          <p className="text-xs text-zinc-500">max price</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">
                            {formatCurrency(show.minPrice)}
                          </p>
                          <p className="text-xs text-zinc-500">min price</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Link
                          href={`/admin/events/new?bandId=${show.id}&bandName=${encodeURIComponent(show.name)}&avgPrice=${Math.round(show.avgPrice)}&demandCount=${show.fanCount}&dreamShowCount=1`}
                        >
                          <Button size="sm" className="gap-1 bg-amber-600 hover:bg-amber-700">
                            <ArrowUpRight className="h-3 w-3" />
                            Promote to Proposed Show
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-amber-600">
                  No dream show signals yet. Users need to toggle dream show
                  preferences during onboarding.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand by City</CardTitle>
              <CardDescription>
                Where fans want to see shows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="fans"
                      name="Fans"
                      fill="#ea580c"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-zinc-400">
                  No city preference data yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
