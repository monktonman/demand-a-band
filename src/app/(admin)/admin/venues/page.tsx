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
import { MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const venues = await prisma.venue.findMany({
    orderBy: { capacity: "desc" },
    include: {
      _count: { select: { events: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Venues</h1>
          <p className="text-zinc-500">
            {venues.length} venues in the Baltimore DMA
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            Venue Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead>Genres</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead className="text-right">Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{venue.name}</p>
                      <p className="text-xs text-zinc-400">{venue.address}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {venue.city}, {venue.state}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{venue.venueType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {venue.capacity.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {venue.genres.slice(0, 3).map((g) => (
                        <Badge key={g} variant="secondary" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        venue.ownership === "INDEPENDENT"
                          ? "border-green-300 text-green-700"
                          : venue.ownership === "NONPROFIT"
                            ? "border-blue-300 text-blue-700"
                            : "border-purple-300 text-purple-700"
                      }
                    >
                      {venue.ownership.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {venue._count.events}
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
