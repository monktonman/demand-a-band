"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Music2,
  MapPin,
  Search,
  X,
  Star,
  ArrowRight,
  Check,
  DollarSign,
  PartyPopper,
  Copy,
  MessageCircle,
  Mail,
  Share2,
} from "lucide-react";
import Link from "next/link";

type Band = {
  id: string;
  name: string;
  slug: string;
  genres: string[];
  popularity: number | null;
  monthlyListeners: number | null;
};

type Venue = {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  venueType: string;
};

const PRICE_TIERS = [
  { label: "$100–200", value: 150, description: "Premium club show" },
  { label: "$200–500", value: 350, description: "Once-in-a-lifetime" },
  { label: "$500–1,000", value: 750, description: "Ultra-exclusive" },
  { label: "$1,000+", value: 1500, description: "Money can't buy" },
];

export default function DreamShowPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [bands, setBands] = useState<Band[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bandSearch, setBandSearch] = useState("");
  const [bandResults, setBandResults] = useState<Band[]>([]);
  const [searching, setSearching] = useState(false);

  // Selections
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Load venues
  useEffect(() => {
    fetch("/api/admin/venues")
      .then((r) => r.json())
      .then((data) => setVenues(data.venues || []))
      .catch(() => {});
  }, []);

  // Debounced band search
  const searchBands = useCallback(async (query: string) => {
    if (query.length < 2) {
      setBandResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/bands/search?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setBandResults(data.bands || []);
    } catch {
      setBandResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchBands(bandSearch), 300);
    return () => clearTimeout(timer);
  }, [bandSearch, searchBands]);

  // Load popular bands initially
  useEffect(() => {
    fetch("/api/bands?limit=12&sortBy=popularity&sortOrder=desc")
      .then((r) => r.json())
      .then((data) => setBands(data.bands || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!selectedBand || !selectedVenue || !selectedPrice) return;

    if (!session?.user) {
      // Not logged in — save to localStorage and redirect to register
      localStorage.setItem(
        "dreamShow",
        JSON.stringify({
          bandId: selectedBand.id,
          bandName: selectedBand.name,
          venueId: selectedVenue.id,
          venueName: selectedVenue.name,
          maxTicketPrice: selectedPrice,
          priceTierLabel: selectedPriceLabel,
        })
      );
      window.location.href = "/register";
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dream-shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bandId: selectedBand.id,
          venueId: selectedVenue.id,
          maxTicketPrice: selectedPrice,
          priceTierLabel: selectedPriceLabel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.shareCode) {
        setShareCode(data.shareCode);
        setSubmitted(true);
      } else {
        // Fallback: still show success
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareUrl =
    typeof window !== "undefined" && shareCode
      ? `${window.location.origin}/dream-show/${shareCode}`
      : "";

  const shareText = selectedBand && selectedVenue
    ? `I want to see ${selectedBand.name} at ${selectedVenue.name} (${selectedVenue.capacity} cap)! Opt in to help make it happen:`
    : "";

  const copyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Success header */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Dream Show Created!</h1>
          <p className="mt-4 text-lg text-zinc-600">
            <strong>{selectedBand?.name}</strong> at{" "}
            <strong>{selectedVenue?.name}</strong>
          </p>
        </div>

        {/* Share CTA - this is the key viral moment */}
        {shareCode && (
          <Card className="mt-8 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Share2 className="mx-auto mb-2 h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold">Now rally your friends!</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  The more fans who opt in, the more likely we can make this happen.
                  Share your dream show link:
                </p>
              </div>

              {/* Share URL */}
              <div className="flex items-center gap-2 rounded-lg bg-white border border-zinc-200 p-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-sm text-zinc-700 outline-none px-2 truncate"
                />
                <Button
                  onClick={copyLink}
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  asChild
                  className="h-auto flex-col gap-1.5 py-3 bg-white"
                >
                  <a
                    href={`sms:&body=${encodeURIComponent(shareText + " " + shareUrl)}`}
                  >
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xs">Text</span>
                  </a>
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="h-auto flex-col gap-1.5 py-3 bg-white"
                >
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Dream Show: ${selectedBand?.name} at ${selectedVenue?.name}`)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`}
                  >
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-xs">Email</span>
                  </a>
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="h-auto flex-col gap-1.5 py-3 bg-white"
                >
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="h-5 w-5 text-zinc-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-xs">X / Twitter</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View & Build Another */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {shareCode && (
            <Link href={`/dream-show/${shareCode}`}>
              <Button className="bg-orange-600 hover:bg-orange-700">
                View Your Dream Show Page
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button
            onClick={() => {
              setSubmitted(false);
              setSelectedBand(null);
              setSelectedVenue(null);
              setSelectedPrice(null);
              setSelectedPriceLabel("");
              setShareCode("");
              setStep(1);
            }}
            variant="outline"
          >
            Build Another Dream Show
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-1.5 text-sm font-medium text-orange-700">
          <Sparkles className="h-4 w-4" />
          Premium Experiences
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Build Your{" "}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Dream Show
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-500">
          Imagine seeing a stadium-level act in a 400-seat room. Pick your dream artist,
          choose the venue, and tell us what you&apos;d pay. When enough fans agree — we make it happen.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-10 flex items-center justify-center gap-2">
        {[
          { num: 1, label: "Pick Artist" },
          { num: 2, label: "Choose Venue" },
          { num: 3, label: "Set Price" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (s.num <= step) setStep(s.num);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                s.num < step
                  ? "bg-green-500 text-white"
                  : s.num === step
                    ? "bg-orange-600 text-white ring-4 ring-orange-100"
                    : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {s.num < step ? <Check className="h-4 w-4" /> : s.num}
            </button>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                s.num === step ? "text-orange-700" : "text-zinc-400"
              }`}
            >
              {s.label}
            </span>
            {s.num < 3 && (
              <div className={`h-0.5 w-8 sm:w-16 ${s.num < step ? "bg-green-500" : "bg-zinc-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Pick Artist */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold">Who&apos;s your dream act?</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Think big — stadium headliners in a tiny club
            </p>
          </div>

          {/* Search */}
          <div className="relative mx-auto max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search for an artist..."
              value={bandSearch}
              onChange={(e) => setBandSearch(e.target.value)}
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-base outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              autoFocus
            />
            {bandSearch && (
              <button
                onClick={() => { setBandSearch(""); setBandResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search results or popular bands */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(bandSearch.length >= 2 ? bandResults : bands).map((band) => (
              <button
                key={band.id}
                onClick={() => {
                  setSelectedBand(band);
                  setStep(2);
                }}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                  selectedBand?.id === band.id
                    ? "border-orange-500 bg-orange-50"
                    : "border-zinc-100 hover:border-orange-200"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                  <Music2 className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{band.name}</p>
                  <p className="text-xs text-zinc-400 truncate">
                    {band.genres.slice(0, 2).join(" · ")}
                  </p>
                </div>
                {(band.popularity ?? 0) >= 70 && (
                  <Star className="ml-auto h-4 w-4 shrink-0 text-amber-400" />
                )}
              </button>
            ))}
          </div>

          {bandSearch.length >= 2 && bandResults.length === 0 && !searching && (
            <p className="text-center text-sm text-zinc-400">
              No artists found for &ldquo;{bandSearch}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Step 2: Choose Venue */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold">
              Where should{" "}
              <span className="text-orange-600">{selectedBand?.name}</span>{" "}
              play?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              The smaller the venue, the more exclusive the experience
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {venues
              .sort((a, b) => a.capacity - b.capacity)
              .map((venue) => (
                <button
                  key={venue.id}
                  onClick={() => {
                    setSelectedVenue(venue);
                    setStep(3);
                  }}
                  className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                    selectedVenue?.id === venue.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-zinc-100 hover:border-orange-200"
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{venue.name}</p>
                    <p className="text-xs text-zinc-400">
                      {venue.city}, {venue.state} · {venue.venueType}
                    </p>
                  </div>
                  <Badge className="shrink-0 bg-zinc-100 text-zinc-600">
                    {venue.capacity} cap
                  </Badge>
                </button>
              ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-zinc-500 hover:text-orange-600"
            >
              ← Change artist
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Set Price */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold">
              What would you pay to see{" "}
              <span className="text-orange-600">{selectedBand?.name}</span>{" "}
              at{" "}
              <span className="text-orange-600">{selectedVenue?.name}</span>?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {selectedVenue?.capacity}-person venue · Once-in-a-lifetime experience
            </p>
          </div>

          {/* Summary card */}
          <Card className="mx-auto max-w-md border-orange-200 bg-orange-50/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                <Sparkles className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-bold">{selectedBand?.name}</p>
                <p className="text-sm text-zinc-600">
                  at {selectedVenue?.name} ({selectedVenue?.capacity} cap)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Price tiers */}
          <div className="mx-auto max-w-md space-y-3">
            {PRICE_TIERS.map((tier) => (
              <button
                key={tier.value}
                onClick={() => { setSelectedPrice(tier.value); setSelectedPriceLabel(tier.label); }}
                className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                  selectedPrice === tier.value
                    ? "border-orange-500 bg-orange-50"
                    : "border-zinc-100 hover:border-orange-200"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    selectedPrice === tier.value
                      ? "bg-orange-600 text-white"
                      : "bg-zinc-100"
                  }`}
                >
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{tier.label}</p>
                  <p className="text-xs text-zinc-500">{tier.description}</p>
                </div>
                {selectedPrice === tier.value && (
                  <Check className="ml-auto h-5 w-5 text-orange-600" />
                )}
              </button>
            ))}
          </div>

          {/* Submit */}
          <div className="mx-auto max-w-md space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={!selectedPrice || isSubmitting}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-base hover:from-orange-700 hover:to-amber-700 h-12"
              size="lg"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : session?.user ? (
                <>
                  Submit My Dream Show
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Sign Up to Submit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-zinc-400">
              We&apos;ll track demand and work to make it happen when enough fans agree
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-zinc-500 hover:text-orange-600"
            >
              ← Change venue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
