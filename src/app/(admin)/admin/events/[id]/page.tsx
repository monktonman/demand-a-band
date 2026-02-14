"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Ticket,
  MapPin,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface EventDetail {
  id: string;
  title: string;
  status: string;
  ticketPrice: string;
  serviceFee: string;
  minPledges: number;
  maxCapacity: number;
  eventDate: string;
  pledgeDeadline: string;
  band: { name: string; genres: string[] };
  venue: { name: string; city: string; state: string; capacity: number };
  _count: { pledges: number };
}

export default function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadEvent() {
      const res = await fetch(`/api/events?id=${id}`);
      const data = await res.json();
      // Find the specific event from the list
      const found = data.events?.find((e: EventDetail) => e.id === id);
      setEvent(found || null);
      setIsLoading(false);
    }
    loadEvent();
  }, [id]);

  const handleAction = async (action: "confirm" | "cancel") => {
    if (action === "confirm") setIsConfirming(true);
    else setIsCancelling(true);
    setResult(null);

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} event`);
      }

      if (action === "confirm" && data.payments) {
        setResult({
          type: "success",
          message: `Event confirmed! ${data.payments.succeeded}/${data.payments.total} payments processed successfully.${data.payments.failed > 0 ? ` ${data.payments.failed} failed.` : ""}`,
        });
      } else {
        setResult({
          type: "success",
          message:
            action === "cancel"
              ? `Event cancelled. ${data.cancelledPledges} pledges cancelled.`
              : "Event updated.",
        });
      }

      // Refresh event data
      const refreshRes = await fetch(`/api/events?id=${id}`);
      const refreshData = await refreshRes.json();
      const refreshed = refreshData.events?.find(
        (e: EventDetail) => e.id === id
      );
      if (refreshed) setEvent(refreshed);
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setIsConfirming(false);
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">Event not found</p>
        <Link href="/admin/events">
          <Button variant="link" className="mt-2">
            Back to events
          </Button>
        </Link>
      </div>
    );
  }

  const ticketPrice = Number(event.ticketPrice);
  const serviceFee = Number(event.serviceFee);
  const pledgeCount = event._count.pledges;
  const progress = Math.min((pledgeCount / event.minPledges) * 100, 100);
  const canConfirm =
    event.status === "PROPOSED" || event.status === "THRESHOLD_MET";
  const canCancel = event.status !== "COMPLETED" && event.status !== "CANCELLED";

  const STATUS_COLORS: Record<string, string> = {
    PROPOSED: "bg-blue-100 text-blue-800",
    THRESHOLD_MET: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-zinc-100 text-zinc-800",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/events">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <Badge className={STATUS_COLORS[event.status] || "bg-zinc-500"}>
              {event.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-zinc-500">
            {event.band.name} at {event.venue.name}
          </p>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-md p-4 text-sm ${
            result.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Event details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span>{new Date(event.eventDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-zinc-400" />
              <span>
                {event.venue.name} ({event.venue.city}, {event.venue.state})
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Ticket className="h-4 w-4 text-zinc-400" />
              <span>
                ${ticketPrice} + ${serviceFee.toFixed(2)} fee = $
                {(ticketPrice + serviceFee).toFixed(2)} total
              </span>
            </div>
            <Separator />
            <div className="text-sm text-zinc-500">
              <p>
                Pledge deadline:{" "}
                {new Date(event.pledgeDeadline).toLocaleString()}
              </p>
              <p>
                Capacity: {event.maxCapacity} (venue: {event.venue.capacity})
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pledge stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Pledge Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-orange-600">
                {pledgeCount}
              </span>
              <span className="text-lg text-zinc-400">
                {" "}
                / {event.minPledges} minimum
              </span>
            </div>
            <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-center text-sm text-zinc-500">
              {progress >= 100
                ? "Threshold met!"
                : `${Math.max(event.minPledges - pledgeCount, 0)} more needed`}
            </p>
            <Separator />
            <p className="text-sm text-zinc-500">
              Estimated revenue:{" "}
              <span className="font-semibold text-zinc-900">
                ${(pledgeCount * (ticketPrice + serviceFee)).toLocaleString()}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {(canConfirm || canCancel) && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
            <CardDescription>
              Confirm to lock in the event and charge pledgers, or cancel to
              release all pledges.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            {canConfirm && (
              <Button
                onClick={() => handleAction("confirm")}
                disabled={isConfirming || isCancelling}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming & Charging...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Event
                  </>
                )}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => handleAction("cancel")}
                disabled={isConfirming || isCancelling}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Event
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {event.status === "CONFIRMED" && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="h-5 w-5" />
          This event has been confirmed. Pledgers have been / are being charged.
        </div>
      )}

      {event.status === "CANCELLED" && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5" />
          This event has been cancelled. All active pledges were released.
        </div>
      )}
    </div>
  );
}
