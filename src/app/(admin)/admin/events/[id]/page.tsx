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
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Ticket,
  MapPin,
  Calendar,
  AlertTriangle,
  Pencil,
  QrCode,
  Search,
  Download,
  ClipboardCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { use } from "react";

interface PledgeDetail {
  id: string;
  quantity: number;
  totalAmount: string;
  status: string;
  chargedAt: string | null;
  user: { id: string; name: string | null; email: string };
}

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
  ticketCount?: number;
  pledges?: PledgeDetail[];
  _count: { pledges: number };
}

const PLEDGE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  CHARGED: "bg-green-100 text-green-800",
  PAYMENT_FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-zinc-100 text-zinc-800",
};

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
  const [guestList, setGuestList] = useState<{
    stats: { totalTickets: number; checkedIn: number; remaining: number };
    tickets: {
      id: string;
      ticketCode: string;
      fanName: string;
      fanEmail: string;
      checkedInAt: string | null;
      checkedInBy: string | null;
      pledgeQuantity: number;
    }[];
  } | null>(null);
  const [guestListLoading, setGuestListLoading] = useState(false);
  const [guestFilter, setGuestFilter] = useState("");
  const [guestView, setGuestView] = useState<"all" | "checked-in" | "remaining">("all");

  const loadEvent = async () => {
    const res = await fetch(`/api/admin/events/${id}`);
    const data = await res.json();
    setEvent(data.event || null);
    setIsLoading(false);
  };

  const loadGuestList = async () => {
    setGuestListLoading(true);
    try {
      const res = await fetch(`/api/check-in?eventId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setGuestList({ stats: data.stats, tickets: data.tickets });
      }
    } catch (err) {
      console.error("Failed to load guest list:", err);
    } finally {
      setGuestListLoading(false);
    }
  };

  const handleManualCheckIn = async (ticketCode: string) => {
    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode, eventId: id }),
      });
      if (res.ok) {
        await loadGuestList();
      }
    } catch (err) {
      console.error("Manual check-in failed:", err);
    }
  };

  const exportGuestListCsv = () => {
    if (!guestList) return;
    const headers = ["Name", "Email", "Ticket Code", "Checked In", "Checked In At"];
    const rows = guestList.tickets.map((t) => [
      t.fanName,
      t.fanEmail,
      t.ticketCode,
      t.checkedInAt ? "Yes" : "No",
      t.checkedInAt ? new Date(t.checkedInAt).toLocaleString() : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guest-list-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  // Load guest list when event is confirmed
  useEffect(() => {
    if (event?.status === "CONFIRMED" || event?.status === "COMPLETED") {
      loadGuestList();
    }
  }, [event?.status]);

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
        const errorMsg = data.error || `Failed to ${action} event`;
        const paymentInfo =
          data.payments?.failed > 0
            ? ` (${data.payments.failed}/${data.payments.total} payments failed)`
            : "";
        throw new Error(errorMsg + paymentInfo);
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
      await loadEvent();
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
      // Still refresh to show updated pledge statuses
      await loadEvent();
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
  const pledgeCount = event.ticketCount ?? event._count.pledges;
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
        {(event.status === "PROPOSED" || event.status === "THRESHOLD_MET" || event.status === "CANCELLED") && (
          <Link href={`/admin/events/${id}/edit`}>
            <Button variant="outline" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        )}
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

      {/* Guest List & Check-In (for CONFIRMED/COMPLETED events) */}
      {(event.status === "CONFIRMED" || event.status === "COMPLETED") && guestList && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-green-600" />
                Guest List & Check-In
              </CardTitle>
              <div className="flex items-center gap-2">
                <Link href={`/check-in/${id}`} target="_blank">
                  <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700">
                    <QrCode className="h-3.5 w-3.5" />
                    Open Scanner
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportGuestListCsv}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </div>
            <CardDescription>
              {guestList.stats.checkedIn} of {guestList.stats.totalTickets} checked in
              {" "}&middot;{" "}
              {guestList.stats.remaining} remaining
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Check-in progress bar */}
            <div className="mb-4">
              <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${
                      guestList.stats.totalTickets > 0
                        ? (guestList.stats.checkedIn / guestList.stats.totalTickets) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Search by name or ticket code..."
                  value={guestFilter}
                  onChange={(e) => setGuestFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                {(["all", "checked-in", "remaining"] as const).map((view) => (
                  <Button
                    key={view}
                    size="sm"
                    variant={guestView === view ? "default" : "outline"}
                    className={guestView === view ? "bg-orange-600 hover:bg-orange-700" : ""}
                    onClick={() => setGuestView(view)}
                  >
                    {view === "all"
                      ? `All (${guestList.stats.totalTickets})`
                      : view === "checked-in"
                      ? `In (${guestList.stats.checkedIn})`
                      : `Left (${guestList.stats.remaining})`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Guest table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fan</TableHead>
                    <TableHead>Ticket Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guestList.tickets
                    .filter((t) => {
                      // Filter by view
                      if (guestView === "checked-in" && !t.checkedInAt) return false;
                      if (guestView === "remaining" && t.checkedInAt) return false;
                      // Filter by search
                      if (guestFilter) {
                        const q = guestFilter.toLowerCase();
                        return (
                          t.fanName.toLowerCase().includes(q) ||
                          t.fanEmail.toLowerCase().includes(q) ||
                          t.ticketCode.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{ticket.fanName}</p>
                            <p className="text-xs text-zinc-400">{ticket.fanEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded">
                            {ticket.ticketCode}
                          </code>
                        </TableCell>
                        <TableCell>
                          {ticket.checkedInAt ? (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-green-700">
                                {new Date(ticket.checkedInAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">Not checked in</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!ticket.checkedInAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleManualCheckIn(ticket.ticketCode)}
                            >
                              <CheckCircle className="h-3 w-3" />
                              Check In
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            {guestListLoading && (
              <div className="mt-4 flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pledges table */}
      {event.pledges && event.pledges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-600" />
              Pledges ({event.pledges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {event.pledges.map((pledge) => (
                <div
                  key={pledge.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {pledge.user.name || pledge.user.email}
                    </p>
                    {pledge.user.name && (
                      <p className="text-xs text-zinc-400 truncate">
                        {pledge.user.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-zinc-500">
                      {pledge.quantity} {pledge.quantity === 1 ? "ticket" : "tickets"}
                    </span>
                    <span className="font-medium">
                      ${Number(pledge.totalAmount).toFixed(2)}
                    </span>
                    <Badge
                      className={
                        PLEDGE_STATUS_COLORS[pledge.status] || "bg-zinc-100 text-zinc-800"
                      }
                    >
                      {pledge.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
