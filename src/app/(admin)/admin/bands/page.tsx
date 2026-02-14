import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music2, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBandsPage() {
  const bands = await prisma.band.findMany({
    orderBy: { popularity: "desc" },
    include: {
      _count: { select: { userPreferences: true } },
      userPreferences: {
        select: { maxTicketPrice: true, isDreamShow: true },
      },
    },
  });

  const bandsWithStats = bands.map((band) => {
    const prefs = band.userPreferences;
    const dreamPrefs = prefs.filter((p) => p.isDreamShow);
    const avgPrice =
      prefs.length > 0
        ? Math.round(prefs.reduce((s, p) => s + Number(p.maxTicketPrice), 0) / prefs.length)
        : 0;

    return {
      ...band,
      demandCount: band._count.userPreferences,
      avgPrice,
      dreamShowCount: dreamPrefs.length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bands</h1>
        <p className="text-zinc-500">
          {bands.length} bands in the database
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-orange-600" />
            Band Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Band</TableHead>
                <TableHead>Genres</TableHead>
                <TableHead className="text-right">Popularity</TableHead>
                <TableHead className="text-right">Demand</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">Dream Shows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bandsWithStats.map((band) => (
                <TableRow key={band.id}>
                  <TableCell className="font-medium">{band.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {band.genres.slice(0, 3).map((g) => (
                        <Badge key={g} variant="outline" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{band.popularity}</TableCell>
                  <TableCell className="text-right">
                    {band.demandCount > 0 ? (
                      <Badge className="bg-orange-600">{band.demandCount}</Badge>
                    ) : (
                      <span className="text-zinc-300">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {band.avgPrice > 0 ? formatCurrency(band.avgPrice) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {band.dreamShowCount > 0 ? (
                      <Badge className="gap-1 bg-amber-500">
                        <Sparkles className="h-3 w-3" />
                        {band.dreamShowCount}
                      </Badge>
                    ) : (
                      <span className="text-zinc-300">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
