"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import type { EventStatus } from "@prisma/client";

interface SerializedEvent {
  id: string;
  title: string;
  status: EventStatus;
  eventDate: string;
  ticketPrice: string;
  minPledges: number;
  bandName: string;
  venueName: string;
  pledgeCount: number;
}

export function AdminEventsClient({ events }: { events: SerializedEvent[] }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<SerializedEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = (status: EventStatus) =>
    status === "PROPOSED" || status === "CANCELLED";

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/events/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete event");
      }

      toast.success(`"${deleteTarget.title}" has been deleted`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-orange-600 hover:underline"
                      >
                        {event.title}
                      </Link>
                    </TableCell>
                    <TableCell>{event.bandName}</TableCell>
                    <TableCell>{event.venueName}</TableCell>
                    <TableCell>{formatDate(event.eventDate)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(event.ticketPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      {event.pledgeCount}
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
                    <TableCell className="text-right">
                      {canDelete(event.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(event)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            Are you sure you want to delete{" "}
            <strong>&quot;{deleteTarget?.title}&quot;</strong>?
            {deleteTarget && deleteTarget.pledgeCount > 0 && (
              <span className="mt-1 block text-amber-600">
                {deleteTarget.pledgeCount} pledge(s) will also be removed.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
