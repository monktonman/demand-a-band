"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Music2, MapPin } from "lucide-react";
import Link from "next/link";
import { formatCurrency, calculateServiceFee } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { format } from "date-fns";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  doorsTime: string | null;
  showTime: string | null;
  ticketPrice: number;
  serviceFee: number;
  minPledges: number;
  maxCapacity: number;
  pledgeDeadline: string;
  status: string;
  band: { id: string; name: string; genres: string[] };
  venue: { id: string; name: string; city: string; state: string; capacity: number };
  _count: { pledges: number };
}

const STATUS_COLORS: Record<string, string> = {
  PROPOSED: "bg-blue-100 text-blue-700",
  THRESHOLD_MET: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-zinc-100 text-zinc-700",
};

function extractTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    doorsTime: "",
    showTime: "",
    ticketPrice: 40,
    minPledges: 100,
    maxCapacity: 400,
    pledgeDeadline: "",
  });

  // Load event data
  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/admin/events/${id}`);
        if (!res.ok) throw new Error("Failed to load event");
        const data = await res.json();
        const ev = data.event;
        setEvent(ev);

        setFormData({
          title: ev.title,
          description: ev.description || "",
          eventDate: ev.eventDate ? format(new Date(ev.eventDate), "yyyy-MM-dd") : "",
          doorsTime: extractTime(ev.doorsTime),
          showTime: extractTime(ev.showTime),
          ticketPrice: Number(ev.ticketPrice),
          minPledges: ev.minPledges,
          maxCapacity: ev.maxCapacity,
          pledgeDeadline: ev.pledgeDeadline ? format(new Date(ev.pledgeDeadline), "yyyy-MM-dd") : "",
        });
      } catch {
        setError("Failed to load event");
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  const serviceFee = calculateServiceFee(formData.ticketPrice);

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    if (!formData.eventDate) {
      setError("Please select an event date");
      setIsSaving(false);
      return;
    }
    if (!formData.pledgeDeadline) {
      setError("Please select a pledge deadline");
      setIsSaving(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        eventDate: formData.eventDate,
        pledgeDeadline: formData.pledgeDeadline,
        doorsTime: formData.doorsTime
          ? `${formData.eventDate.split("T")[0]}T${formData.doorsTime}`
          : null,
        showTime: formData.showTime
          ? `${formData.eventDate.split("T")[0]}T${formData.showTime}`
          : null,
      };

      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update event");
      }

      setSuccess("Event updated successfully!");
      setTimeout(() => {
        router.push(`/admin/events/${id}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const isEditable =
    event?.status === "PROPOSED" ||
    event?.status === "THRESHOLD_MET" ||
    event?.status === "CANCELLED";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-zinc-500">Event not found</p>
        <Link href="/admin/events">
          <Button variant="outline" className="mt-4">
            Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  if (!isEditable) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-zinc-500">
          This event cannot be edited in its current state ({event.status.toLowerCase()}).
        </p>
        <Link href={`/admin/events/${id}`}>
          <Button variant="outline" className="mt-4">
            Back to Event
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Edit Event</h1>
          <p className="text-zinc-500">Update show details</p>
        </div>
        <Badge className={STATUS_COLORS[event.status]}>
          {event.status}
        </Badge>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Read-only info */}
      <Card className="bg-zinc-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <Music2 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold">{event.band.name}</p>
              <p className="text-sm text-zinc-500">{event.band.genres.slice(0, 3).join(", ")}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                <MapPin className="h-3.5 w-3.5" />
                {event.venue.name}
              </div>
              <p className="text-xs text-zinc-400">
                {event.venue.city}, {event.venue.state} · cap: {event.venue.capacity}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            {event._count.pledges} pledge{event._count.pledges !== 1 ? "s" : ""} so far · Artist and venue cannot be changed
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Show Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Tell fans about this show..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule & Pricing</CardTitle>
            <CardDescription>Update the event schedule and ticket pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Date</Label>
                <DateTimePicker
                  value={formData.eventDate}
                  onChange={(val) => updateField("eventDate", val)}
                  required
                  includeTime={false}
                  minDate={new Date()}
                  placeholder="Pick event date"
                />
              </div>
              <div className="space-y-2">
                <Label>Pledge Deadline</Label>
                <DateTimePicker
                  value={formData.pledgeDeadline}
                  onChange={(val) => updateField("pledgeDeadline", val)}
                  required
                  includeTime={false}
                  minDate={new Date()}
                  placeholder="Pick deadline"
                />
                <p className="text-xs text-zinc-400">
                  Fans must pledge by this date
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Doors Open</Label>
                <select
                  value={formData.doorsTime}
                  onChange={(e) => updateField("doorsTime", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Not set</option>
                  {Array.from({ length: 24 }, (_, h) =>
                    [0, 30].map((m) => {
                      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      const ampm = h < 12 ? "AM" : "PM";
                      const label = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
                      const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Show Time</Label>
                <select
                  value={formData.showTime}
                  onChange={(e) => updateField("showTime", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Not set</option>
                  {Array.from({ length: 24 }, (_, h) =>
                    [0, 30].map((m) => {
                      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      const ampm = h < 12 ? "AM" : "PM";
                      const label = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
                      const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })
                  )}
                </select>
                <p className="text-xs text-zinc-400">
                  The time the show starts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ticket Price ($)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.ticketPrice}
                  onChange={(e) =>
                    updateField("ticketPrice", Number(e.target.value))
                  }
                  required
                />
                <p className="text-xs text-zinc-400">
                  + {formatCurrency(serviceFee)} fee = {formatCurrency(formData.ticketPrice + serviceFee)} total
                </p>
              </div>
              <div className="space-y-2">
                <Label>Min Pledges</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.minPledges}
                  onChange={(e) =>
                    updateField("minPledges", Number(e.target.value))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxCapacity}
                  onChange={(e) =>
                    updateField("maxCapacity", Number(e.target.value))
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/admin/events/${id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
