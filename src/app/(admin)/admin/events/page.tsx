import { prisma } from "@/lib/prisma";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
    include: {
      band: true,
      venue: true,
      _count: { select: { pledges: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-zinc-500">{events.length} events total</p>
        </div>
        <Link href="/admin/events/new">
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            All Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Band</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Pledges</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.band.name}</TableCell>
                    <TableCell>{event.venue.name}</TableCell>
                    <TableCell>{formatDate(event.eventDate)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(event.ticketPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      {event._count.pledges}
                    </TableCell>
                    <TableCell className="text-right">
                      {event.minPledges}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          EVENT_STATUS_COLORS[event.status] || "bg-zinc-500"
                        }
                      >
                        {EVENT_STATUS_LABELS[event.status] || event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-zinc-400">
              <Calendar className="mx-auto mb-3 h-10 w-10" />
              <p>No events yet.</p>
              <p className="mt-1 text-sm">
                Create your first event from the demand data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
