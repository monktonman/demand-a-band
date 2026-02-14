"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Loader2, CalendarRange, Info } from "lucide-react";
import Link from "next/link";
import { formatCurrency, calculateServiceFee } from "@/lib/utils";

interface Band {
  id: string;
  name: string;
  genres: string[];
}

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [bands, setBands] = useState<Band[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    bandId: "",
    venueId: "",
    title: "",
    description: "",
    windowStart: "",
    windowEnd: "",
    eventDate: "",
    doorsTime: "",
    showTime: "",
    ticketPrice: 40,
    minPledges: 100,
    maxCapacity: 400,
    pledgeDeadline: "",
  });

  useEffect(() => {
    async function loadData() {
      const [bandsRes, venuesRes] = await Promise.all([
        fetch("/api/bands"),
        fetch("/api/admin/venues"),
      ]);
      const bandsData = await bandsRes.json();
      const venuesData = await venuesRes.json();
      setBands(bandsData.bands || []);
      setVenues(venuesData.venues || []);
    }
    loadData();
  }, []);

  const serviceFee = calculateServiceFee(formData.ticketPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      router.push("/admin/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate title
    if (field === "bandId" || field === "venueId") {
      const bandName =
        field === "bandId"
          ? bands.find((b) => b.id === value)?.name
          : bands.find((b) => b.id === formData.bandId)?.name;
      const venueName =
        field === "venueId"
          ? venues.find((v) => v.id === value)?.name
          : venues.find((v) => v.id === formData.venueId)?.name;

      if (bandName && venueName) {
        setFormData((prev) => ({
          ...prev,
          [field]: value as string,
          title: `${bandName} at ${venueName}`,
        }));
      }
    }

    // Auto-set max capacity from venue
    if (field === "venueId") {
      const venue = venues.find((v) => v.id === value);
      if (venue) {
        setFormData((prev) => ({
          ...prev,
          venueId: value as string,
          maxCapacity: venue.capacity,
        }));
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/events">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Event</h1>
          <p className="text-zinc-500">
            Propose a new show based on demand data
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Show Details</CardTitle>
            <CardDescription>Select the band and venue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Band</Label>
              <select
                value={formData.bandId}
                onChange={(e) => updateField("bandId", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a band...</option>
                {bands.map((band) => (
                  <option key={band.id} value={band.id}>
                    {band.name} ({band.genres.slice(0, 2).join(", ")})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Venue</Label>
              <select
                value={formData.venueId}
                onChange={(e) => updateField("venueId", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a venue...</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} ({venue.city}, {venue.state} - cap:{" "}
                    {venue.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Auto-generated from band + venue"
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
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-orange-600" />
              Availability Window
            </CardTitle>
            <CardDescription>
              The date range when the band and venue are both available.
              Fans will see this window — the exact date is locked in when the event is confirmed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-blue-600" />
                <p className="text-xs text-blue-700">
                  Set the window to the range of dates both the band and venue are available.
                  The &quot;Target Date&quot; below is shown as an estimate — it becomes the confirmed date once the event is locked in.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Window Start</Label>
                <Input
                  type="date"
                  value={formData.windowStart}
                  onChange={(e) => updateField("windowStart", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Window End</Label>
                <Input
                  type="date"
                  value={formData.windowEnd}
                  onChange={(e) => updateField("windowEnd", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Event Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) => updateField("eventDate", e.target.value)}
                  required
                />
                <p className="text-xs text-zinc-400">
                  Shown as estimate until confirmed
                </p>
              </div>
              <div className="space-y-2">
                <Label>Pledge Deadline</Label>
                <Input
                  type="datetime-local"
                  value={formData.pledgeDeadline}
                  onChange={(e) =>
                    updateField("pledgeDeadline", e.target.value)
                  }
                  required
                />
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
          <Link href="/admin/events">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
