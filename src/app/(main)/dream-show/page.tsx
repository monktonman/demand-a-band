"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Music2,
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
  Users,
  TrendingUp,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
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

function formatListeners(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

function getPopularityBar(pop: number): string {
  if (pop >= 80) return "bg-orange-500";
  if (pop >= 60) return "bg-orange-400";
  if (pop >= 40) return "bg-orange-300";
  return "bg-zinc-300";
}

const VENUE_SIZES = [
  {
    id: "intimate",
    label: "Intimate",
    capacity: "Under 200",
    description: "Living-room energy. You can see the sweat.",
    icon: "🎤",
  },
  {
    id: "club",
    label: "Club",
    capacity: "200–500",
    description: "Classic club show. Loud, packed, electric.",
    icon: "🎵",
  },
  {
    id: "theater",
    label: "Theater",
    capacity: "500–1,500",
    description: "Great sound, great seats, still personal.",
    icon: "🎭",
  },
  {
    id: "large",
    label: "Large Venue",
    capacity: "1,500–5,000",
    description: "Big room energy with real production.",
    icon: "🏟️",
  },
];

const PRICE_TIERS = [
  { label: "$100–200", value: 150, description: "Premium club show" },
  { label: "$200–500", value: 350, description: "Once-in-a-lifetime" },
  { label: "$500–1,000", value: 750, description: "Ultra-exclusive" },
  { label: "$1,000+", value: 1500, description: "Money can't buy" },
];

type PriceEstimate = {
  suggestedPrice: number;
  priceLow: number;
  priceHigh: number;
  confidence: "high" | "medium" | "low";
  dataSource: "direct" | "popularity" | "default";
  explanation: string;
};

export default function DreamShowPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-orange-100" />
        <div className="mx-auto mt-6 h-8 w-48 animate-pulse rounded-lg bg-zinc-100" />
      </div>
    }>
      <DreamShowContent />
    </Suspense>
  );
}

function DreamShowContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [bands, setBands] = useState<Band[]>([]);
  const [bandSearch, setBandSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [bandPage, setBandPage] = useState(1);
  const [totalBandPages, setTotalBandPages] = useState(1);
  const [totalBands, setTotalBands] = useState(0);
  const BANDS_PER_PAGE = 12;

  // Selections
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [selectedVenueSize, setSelectedVenueSize] = useState<string | null>(null);
  const [selectedVenueSizeLabel, setSelectedVenueSizeLabel] = useState("");
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [customPrice, setCustomPrice] = useState("");

  // Auto-select band from query params (e.g., from Artists page)
  useEffect(() => {
    const bandId = searchParams.get("band");
    const bandName = searchParams.get("bandName");
    if (bandId && bandName && !selectedBand) {
      setSelectedBand({
        id: bandId,
        name: decodeURIComponent(bandName),
        slug: "",
        genres: [],
        popularity: null,
        monthlyListeners: null,
      });
      setStep(2);
    }
  }, [searchParams, selectedBand]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(bandSearch);
      setBandPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [bandSearch]);

  // Reset page on genre change
  useEffect(() => {
    setBandPage(1);
  }, [selectedGenre]);

  // Fetch bands with pagination, search, and genre filter
  const fetchBands = useCallback(async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({
        page: bandPage.toString(),
        limit: BANDS_PER_PAGE.toString(),
        sortBy: "popularity",
        sortOrder: "desc",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedGenre) params.set("genre", selectedGenre);

      const res = await fetch(`/api/bands?${params}`);
      const data = await res.json();
      setBands(data.bands || []);
      setTotalBands(data.pagination?.total || 0);
      setTotalBandPages(data.pagination?.totalPages || 1);
      if (data.genres && genres.length === 0) setGenres(data.genres);
    } catch {
      setBands([]);
    } finally {
      setSearching(false);
    }
  }, [bandPage, debouncedSearch, selectedGenre]);

  useEffect(() => {
    fetchBands();
  }, [fetchBands]);

  // Fetch price estimate when band + venue size are selected
  useEffect(() => {
    if (!selectedBand || !selectedVenueSize) {
      setPriceEstimate(null);
      return;
    }

    const fetchEstimate = async () => {
      setEstimateLoading(true);
      try {
        const res = await fetch(
          `/api/artist-price-estimate?bandId=${encodeURIComponent(selectedBand.id)}&venueSize=${encodeURIComponent(selectedVenueSize)}`
        );
        if (res.ok) {
          const data = await res.json();
          setPriceEstimate(data);
        }
      } catch {
        // Silently fail — the user can still pick a price manually
      } finally {
        setEstimateLoading(false);
      }
    };

    fetchEstimate();
  }, [selectedBand, selectedVenueSize]);

  const handleSubmit = async () => {
    if (!selectedBand || !selectedVenueSize || !selectedPrice) return;

    if (!session?.user) {
      localStorage.setItem(
        "dreamShow",
        JSON.stringify({
          bandId: selectedBand.id,
          bandName: selectedBand.name,
          venueSize: selectedVenueSize,
          venueSizeLabel: selectedVenueSizeLabel,
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
          venueSize: selectedVenueSize,
          venueSizeLabel: selectedVenueSizeLabel,
          maxTicketPrice: selectedPrice,
          priceTierLabel: selectedPriceLabel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.shareCode) {
        setShareCode(data.shareCode);
        setSubmitted(true);
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const venueInfo = VENUE_SIZES.find((v) => v.id === selectedVenueSize);

  const shareUrl =
    typeof window !== "undefined" && shareCode
      ? `${window.location.origin}/dream-show/${shareCode}`
      : "";

  const shareText = selectedBand && venueInfo
    ? `I want to see ${selectedBand.name} in a ${venueInfo.capacity}-person venue! Opt in to help make it happen:`
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
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Dream Show Created!</h1>
          <p className="mt-4 text-lg text-zinc-600">
            <strong>{selectedBand?.name}</strong> in a{" "}
            <strong>{venueInfo?.capacity}-person {venueInfo?.label.toLowerCase()} venue</strong>
          </p>
        </div>

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

              <div className="flex items-center gap-2 rounded-lg bg-white border border-zinc-200 p-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-sm text-zinc-700 outline-none px-2 truncate"
                />
                <Button onClick={copyLink} size="sm" variant="outline" className="shrink-0">
                  {copied ? (
                    <><Check className="mr-1 h-3 w-3 text-green-600" />Copied</>
                  ) : (
                    <><Copy className="mr-1 h-3 w-3" />Copy</>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" asChild className="h-auto flex-col gap-1.5 py-3 bg-white">
                  <a href={`sms:&body=${encodeURIComponent(shareText + " " + shareUrl)}`}>
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xs">Text</span>
                  </a>
                </Button>
                <Button variant="outline" asChild className="h-auto flex-col gap-1.5 py-3 bg-white">
                  <a href={`mailto:?subject=${encodeURIComponent(`Dream Show: ${selectedBand?.name} — ${venueInfo?.label} Venue`)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`}>
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-xs">Email</span>
                  </a>
                </Button>
                <Button variant="outline" asChild className="h-auto flex-col gap-1.5 py-3 bg-white">
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
              setSelectedVenueSize(null);
              setSelectedVenueSizeLabel("");
              setSelectedPrice(null);
              setSelectedPriceLabel("");
              setShareCode("");
              setPriceEstimate(null);
              setCustomPrice("");
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
          Dream Shows
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Build Your{" "}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Dream Show
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-500">
          Pick your dream artist, choose how intimate you want it, set a price
          signal, and share it. When enough fans agree — event planners make it happen.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-10 flex items-center justify-center gap-2">
        {[
          { num: 1, label: "Pick Artist" },
          { num: 2, label: "Venue Size" },
          { num: 3, label: "Set Price" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => { if (s.num <= step) setStep(s.num); }}
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
            <span className={`text-sm font-medium hidden sm:inline ${s.num === step ? "text-orange-700" : "text-zinc-400"}`}>
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
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold">Who&apos;s your dream act?</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Browse {totalBands > 0 ? `${totalBands.toLocaleString()} artists` : "artists"} — think big, stadium headliners in a tiny club
            </p>
          </div>

          {/* Search + Genre filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search artists by name or genre..."
                value={bandSearch}
                onChange={(e) => setBandSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-10 text-sm outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                autoFocus
              />
              {bandSearch && (
                <button
                  onClick={() => setBandSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {genres.length > 0 && (
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-orange-400 sm:w-48"
              >
                <option value="">All genres</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
          </div>

          {/* Active filter badge */}
          {(debouncedSearch || selectedGenre) && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span>
                {totalBands === 0 ? "No artists found" : `${totalBands.toLocaleString()} results`}
              </span>
              {selectedGenre && (
                <button
                  onClick={() => setSelectedGenre("")}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 hover:bg-orange-200"
                >
                  {selectedGenre}
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Artist grid */}
          {searching && bands.length === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-xl bg-zinc-100" />
              ))}
            </div>
          ) : bands.length === 0 ? (
            <div className="py-12 text-center">
              <Music2 className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="font-medium text-zinc-600">No artists found</p>
              <p className="mt-1 text-sm text-zinc-400">Try a different search or genre filter</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bands.map((band) => {
                const pop = band.popularity ?? 0;
                return (
                  <button
                    key={band.id}
                    onClick={() => { setSelectedBand(band); setStep(2); }}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                      selectedBand?.id === band.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-zinc-100 hover:border-orange-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                        <Music2 className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{band.name}</p>
                        <p className="text-xs text-zinc-400 truncate">
                          {band.genres.slice(0, 3).join(" · ") || "Music"}
                        </p>
                      </div>
                      {pop >= 70 && (
                        <Star className="h-4 w-4 shrink-0 text-amber-400" />
                      )}
                    </div>

                    {/* Popularity bar */}
                    {pop > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Popularity
                          </span>
                          <span>{pop}/100</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getPopularityBar(pop)}`}
                            style={{ width: `${pop}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {band.monthlyListeners && (
                      <p className="mt-2 text-xs text-zinc-400">
                        {formatListeners(band.monthlyListeners)} listeners
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalBandPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setBandPage(Math.max(1, bandPage - 1))}
                disabled={bandPage === 1}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="text-sm text-zinc-400">
                Page {bandPage} of {totalBandPages}
              </span>
              <button
                onClick={() => setBandPage(Math.min(totalBandPages, bandPage + 1))}
                disabled={bandPage === totalBandPages}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Choose Venue Size */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold">
              How intimate should the{" "}
              <span className="text-orange-600">{selectedBand?.name}</span>{" "}
              show be?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">The smaller the room, the more exclusive the experience</p>
          </div>

          <div className="mx-auto max-w-lg grid gap-3">
            {VENUE_SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => {
                  setSelectedVenueSize(size.id);
                  setSelectedVenueSizeLabel(`${size.label} (${size.capacity})`);
                  setStep(3);
                }}
                className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all hover:shadow-md ${
                  selectedVenueSize === size.id
                    ? "border-orange-500 bg-orange-50"
                    : "border-zinc-100 hover:border-orange-200"
                }`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                  {size.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{size.label}</p>
                    <span className="text-sm text-zinc-400">{size.capacity} people</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">{size.description}</p>
                </div>
                <Users className="h-5 w-5 shrink-0 text-zinc-300" />
              </button>
            ))}
          </div>

          <div className="text-center">
            <button onClick={() => setStep(1)} className="text-sm text-zinc-500 hover:text-orange-600">
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
              in a{" "}
              <span className="text-orange-600">{venueInfo?.capacity}-person {venueInfo?.label.toLowerCase()} venue</span>?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Your price signal helps event planners understand what fans would commit to
            </p>
          </div>

          <Card className="mx-auto max-w-md border-orange-200 bg-orange-50/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                <Sparkles className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-bold">{selectedBand?.name}</p>
                <p className="text-sm text-zinc-600">{venueInfo?.label} venue · {venueInfo?.capacity} people</p>
              </div>
            </CardContent>
          </Card>

          {/* Price Estimate Card */}
          {estimateLoading && (
            <div className="mx-auto max-w-md">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700">Estimating ticket price based on real show data...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {priceEstimate && !estimateLoading && (
            <div className="mx-auto max-w-md">
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-emerald-900">Suggested: ~${priceEstimate.suggestedPrice}/ticket</p>
                        {priceEstimate.confidence === "high" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            High confidence
                          </span>
                        )}
                        {priceEstimate.confidence === "medium" && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Estimated
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-emerald-700">{priceEstimate.explanation}</p>
                      <p className="mt-1.5 text-xs text-emerald-600/70">
                        Range: ${priceEstimate.priceLow}–${priceEstimate.priceHigh}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPrice(priceEstimate.suggestedPrice);
                      setSelectedPriceLabel(`~$${priceEstimate.suggestedPrice} (estimated)`);
                      setCustomPrice(priceEstimate.suggestedPrice.toString());
                    }}
                    className={`mt-3 w-full rounded-lg border-2 p-2.5 text-sm font-medium transition-all ${
                      selectedPrice === priceEstimate.suggestedPrice
                        ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                        : "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                    }`}
                  >
                    {selectedPrice === priceEstimate.suggestedPrice ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Check className="h-4 w-4" /> Using suggested price
                      </span>
                    ) : (
                      "Use suggested price"
                    )}
                  </button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Custom Price Input */}
          <div className="mx-auto max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-zinc-700">Or set your own price:</p>
              {priceEstimate && (
                <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                  <Info className="h-3 w-3" />
                  Pick a tier or enter an amount
                </span>
              )}
            </div>

            <div className="relative mb-4">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="number"
                placeholder="Enter your max ticket price..."
                value={customPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomPrice(val);
                  const num = parseInt(val);
                  if (num && num >= 15) {
                    setSelectedPrice(num);
                    setSelectedPriceLabel(`$${num}`);
                  } else {
                    setSelectedPrice(null);
                    setSelectedPriceLabel("");
                  }
                }}
                min={15}
                max={10000}
                className={`h-12 w-full rounded-xl border-2 bg-white pl-9 pr-20 text-base outline-none transition-colors ${
                  customPrice && parseInt(customPrice) >= 15
                    ? "border-orange-400 ring-2 ring-orange-100"
                    : "border-zinc-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">per ticket</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PRICE_TIERS.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => {
                    setSelectedPrice(tier.value);
                    setSelectedPriceLabel(tier.label);
                    setCustomPrice(tier.value.toString());
                  }}
                  className={`rounded-lg border-2 px-2 py-2.5 text-center transition-all hover:shadow-sm ${
                    selectedPrice === tier.value
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-zinc-100 text-zinc-600 hover:border-orange-200"
                  }`}
                >
                  <p className="text-sm font-semibold">{tier.label}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{tier.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-md space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={!selectedPrice || isSubmitting}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-base hover:from-orange-700 hover:to-amber-700 h-12"
              size="lg"
            >
              {isSubmitting ? "Submitting..." : session?.user ? (
                <>Submit My Dream Show<ArrowRight className="ml-2 h-4 w-4" /></>
              ) : (
                <>Sign Up to Submit<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <p className="text-center text-xs text-zinc-400">
              We&apos;ll track demand and work to make it happen when enough fans agree
            </p>
          </div>

          <div className="text-center">
            <button onClick={() => setStep(2)} className="text-sm text-zinc-500 hover:text-orange-600">
              ← Change venue size
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
