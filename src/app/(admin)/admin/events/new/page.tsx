"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft, Loader2, CalendarRange, Info, TrendingUp, Sparkles, Search, X, Music2, Clock } from "lucide-react";
import Link from "next/link";
import { formatCurrency, calculateServiceFee } from "@/lib/utils";
import { DateTimePicker, DatePicker } from "@/components/ui/date-time-picker";

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

function CreateEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Band search state
  const [bandSearchQuery, setBandSearchQuery] = useState("");
  const [bandSearchResults, setBandSearchResults] = useState<Band[]>([]);
  const [bandSearching, setBandSearching] = useState(false);
  const [showBandDropdown, setShowBandDropdown] = useState(false);
  const [selectedBandName, setSelectedBandName] = useState("");
  const bandDropdownRef = useRef<HTMLDivElement>(null);

  // Demand context from query params (set by "Promote" button)
  const prefillBandId = searchParams.get("bandId");
  const prefillBandName = searchParams.get("bandName");
  const prefillAvgPrice = searchParams.get("avgPrice");
  const prefillDemandCount = searchParams.get("demandCount");
  const prefillDreamShowCount = searchParams.get("dreamShowCount");
  const isFromDemand = !!prefillBandId;

  const [formData, setFormData] = useState({
    bandId: prefillBandId || "",
    venueId: "",
    title: "",
    description: "",
    windowStart: "",
    windowEnd: "",
    eventDate: "",
    doorsTime: "",
    showTime: "",
    ticketPrice: prefillAvgPrice ? Number(prefillAvgPrice) : 40,
    minPledges: 100,
    maxCapacity: 400,
    pledgeDeadline: "",
  });

  // Set pre-filled band name
  useEffect(() => {
    if (prefillBandName) {
      setSelectedBandName(decodeURIComponent(prefillBandName));
    }
  }, [prefillBandName]);

  // Load venues
  useEffect(() => {
    async function loadData() {
      const venuesRes = await fetch("/api/admin/venues");
      const venuesData = await venuesRes.json();
      setVenues(venuesData.venues || []);
    }
    loadData();
  }, []);

  // Debounced band search
  useEffect(() => {
    if (bandSearchQuery.length < 2) {
      setBandSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBandSearching(true);
      try {
        const res = await fetch(`/api/bands/search?q=${encodeURIComponent(bandSearchQuery)}&limit=12`);
        const data = await res.json();
        setBandSearchResults(data.bands || []);
      } catch {
        setBandSearchResults([]);
      } finally {
        setBandSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [bandSearchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bandDropdownRef.current && !bandDropdownRef.current.contains(e.target as Node)) {
        setShowBandDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectBand = (band: Band) => {
    setSelectedBandName(band.name);
    setBandSearchQuery("");
    setShowBandDropdown(false);
    updateField("bandId", band.id);
    // Auto-generate title if venue is also selected
    const venue = venues.find((v) => v.id === formData.venueId);
    if (venue) {
      setFormData((prev) => ({ ...prev, bandId: band.id, title: `${band.name} at ${venue.name}` }));
    }
  };

  const serviceFee = calculateServiceFee(formData.ticketPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate date fields that aren't native inputs
    if (!formData.eventDate) {
      setError("Please select a target event date");
      setIsLoading(false);
      return;
    }
    if (!formData.pledgeDeadline) {
      setError("Please select a pledge deadline");
      setIsLoading(false);
      return;
    }
    if (!formData.bandId) {
      setError("Please select a band");
      setIsLoading(false);
      return;
    }

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

    // Auto-generate title when venue changes
    if (field === "venueId") {
      const venueName = venues.find((v) => v.id === value)?.name;
      if (selectedBandName && venueName) {
        setFormData((prev) => ({
          ...prev,
          venueId: value as string,
          title: `${selectedBandName} at ${venueName}`,
        }));
      }
      // Auto-set max capacity from venue
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

      {/* Demand Context Banner */}
      {isFromDemand && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                {Number(prefillDreamShowCount) > 0 ? (
                  <Sparkles className="h-5 w-5 text-amber-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-orange-900">
                  Creating from demand: {prefillBandName}
                </h3>
                <div className="mt-1 flex gap-4 text-sm text-orange-700">
                  <span>
                    <strong>{prefillDemandCount}</strong> fans interested
                  </span>
                  <span>
                    Avg price: <strong>{formatCurrency(Number(prefillAvgPrice))}</strong>
                  </span>
                  {Number(prefillDreamShowCount) > 0 && (
                    <span>
                      <strong>{prefillDreamShowCount}</strong> dream show{Number(prefillDreamShowCount) !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <div ref={bandDropdownRef} className="relative">
                {selectedBandName && formData.bandId ? (
                  <div className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3">
                    <div className="flex items-center gap-2">
                      <Music2 className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">{selectedBandName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBandName("");
                        setFormData((prev) => ({ ...prev, bandId: "", title: "" }));
                      }}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={bandSearchQuery}
                      onChange={(e) => {
                        setBandSearchQuery(e.target.value);
                        setShowBandDropdown(true);
                      }}
                      onFocus={() => setShowBandDropdown(true)}
                      placeholder="Search for a band..."
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                    />
                    {/* Hidden required input for form validation */}
                    <input type="hidden" value={formData.bandId} required />
                  </>
                )}

                {/* Search results dropdown */}
                {showBandDropdown && !selectedBandName && bandSearchQuery.length >= 2 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                    {bandSearching ? (
                      <div className="flex items-center gap-2 p-3 text-sm text-zinc-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </div>
                    ) : bandSearchResults.length === 0 ? (
                      <div className="p-3 text-sm text-zinc-400">
                        No bands found for &ldquo;{bandSearchQuery}&rdquo;
                      </div>
                    ) : (
                      bandSearchResults.map((band) => (
                        <button
                          key={band.id}
                          type="button"
                          onClick={() => selectBand(band)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-orange-50 transition-colors border-b border-zinc-50 last:border-0"
                        >
                          <Music2 className="h-4 w-4 shrink-0 text-orange-500" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{band.name}</p>
                            <p className="text-xs text-zinc-400 truncate">
                              {band.genres.slice(0, 3).join(", ")}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {showBandDropdown && !selectedBandName && bandSearchQuery.length < 2 && bandSearchQuery.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg p-3 text-sm text-zinc-400">
                    Type at least 2 characters to search...
                  </div>
                )}
              </div>
              {isFromDemand && formData.bandId && (
                <p className="text-xs text-orange-600">
                  Pre-selected from demand data
                </p>
              )}
              {!formData.bandId && !selectedBandName && (
                <p className="text-xs text-zinc-400">
                  Search from {">"}1,000 artists in the database
                </p>
              )}
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
                <DatePicker
                  value={formData.windowStart}
                  onChange={(val) => updateField("windowStart", val)}
                  minDate={new Date()}
                />
              </div>
              <div className="space-y-2">
                <Label>Window End</Label>
                <DatePicker
                  value={formData.windowEnd}
                  onChange={(val) => updateField("windowEnd", val)}
                  minDate={new Date()}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule & Pricing</CardTitle>
            {isFromDemand && (
              <CardDescription className="text-orange-600">
                Suggested ticket price based on demand: {formatCurrency(Number(prefillAvgPrice))}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Target Event Date & Time
                </Label>
                <DateTimePicker
                  value={formData.eventDate}
                  onChange={(val) => updateField("eventDate", val)}
                  required
                  includeTime={true}
                  minDate={new Date()}
                />
                <p className="text-xs text-zinc-400">
                  Shown as estimate until confirmed
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  Pledge Deadline
                </Label>
                <DateTimePicker
                  value={formData.pledgeDeadline}
                  onChange={(val) => updateField("pledgeDeadline", val)}
                  required
                  includeTime={true}
                  minDate={new Date()}
                />
                <p className="text-xs text-zinc-400">
                  Fans must pledge by this date & time
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

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      }
    >
      <CreateEventForm />
    </Suspense>
  );
}
