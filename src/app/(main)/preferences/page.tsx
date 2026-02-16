"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Music,
  Loader2,
  Search,
  X,
  MapPin,
  Plus,
  Check,
  ArrowLeft,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GENRES, DEFAULT_TICKET_PRICE } from "@/lib/constants";
import { BandSelectionCard } from "@/components/onboarding/band-selection-card";
import { GenreChips } from "@/components/onboarding/genre-chips";
import Link from "next/link";

// ── Types ───────────────────────────────────────────────────────

interface SelectedBand {
  id: string;
  name: string;
  genres: string[];
  imageUrl?: string | null;
  source?: "manual" | "spotify";
}

interface CityPreference {
  city: string;
  state: string;
  maxRadius: number;
}

interface BandResult {
  id: string;
  name: string;
  slug: string;
  genres: string[];
  imageUrl: string | null;
  popularity: number;
}

type TabId = "popular" | "genres" | "search" | "spotify";

const SUGGESTED_CITIES = [
  { city: "Baltimore", state: "MD" },
  { city: "Washington", state: "DC" },
  { city: "Annapolis", state: "MD" },
  { city: "Philadelphia", state: "PA" },
  { city: "Richmond", state: "VA" },
];

// ── Main Component ──────────────────────────────────────────────

function PreferencesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data state
  const [selectedBands, setSelectedBands] = useState<SelectedBand[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [cityPreferences, setCityPreferences] = useState<CityPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [spotifyImported, setSpotifyImported] = useState(false);
  const [spotifyMessage, setSpotifyMessage] = useState("");

  // Band browser state
  const [showBandBrowser, setShowBandBrowser] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("popular");
  const [popularBands, setPopularBands] = useState<BandResult[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [popularPage, setPopularPage] = useState(1);
  const [hasMorePopular, setHasMorePopular] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [genreBands, setGenreBands] = useState<BandResult[]>([]);
  const [isLoadingGenre, setIsLoadingGenre] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BandResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [spotifyBands, setSpotifyBands] = useState<BandResult[]>([]);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);

  const showSpotify = process.env.NEXT_PUBLIC_SPOTIFY_CONFIGURED === "true";

  // ── Load existing preferences ─────────────────────────────────

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/preferences");
        if (!res.ok) throw new Error("Failed to load preferences");
        const data = await res.json();

        // Map band preferences to SelectedBand format
        const bands: SelectedBand[] = (data.bandPreferences || []).map(
          (pref: {
            band: {
              id: string;
              name: string;
              genres: string[];
              imageUrl: string | null;
            };
          }) => ({
            id: pref.band.id,
            name: pref.band.name,
            genres: pref.band.genres,
            imageUrl: pref.band.imageUrl,
            source: "manual" as const,
          })
        );
        setSelectedBands(bands);

        // Map genre preferences
        const genres: string[] = (data.genrePreferences || []).map(
          (pref: { genre: string }) => pref.genre
        );
        setSelectedGenres(genres);

        // Map city preferences
        const cities: CityPreference[] = (data.cityPreferences || []).map(
          (pref: { city: string; state: string; maxRadius: number }) => ({
            city: pref.city,
            state: pref.state,
            maxRadius: pref.maxRadius,
          })
        );
        setCityPreferences(cities.length > 0 ? cities : [{ city: "Baltimore", state: "MD", maxRadius: 50 }]);
      } catch (err) {
        console.error("Failed to load preferences:", err);
        setError("Failed to load your preferences. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadPreferences();
  }, []);

  // ── Handle Spotify return ─────────────────────────────────────

  useEffect(() => {
    const spotifyStatus = searchParams.get("spotify");
    if (!spotifyStatus) return;

    if (spotifyStatus === "success") {
      const newCount = searchParams.get("new") || "0";

      fetch("/api/spotify/matches")
        .then((res) => res.json())
        .then((data) => {
          if (data.bands && data.bands.length > 0) {
            setSelectedBands((prev) => {
              const existingIds = new Set(prev.map((b) => b.id));
              const newBands: SelectedBand[] = data.bands
                .filter((b: { id: string }) => !existingIds.has(b.id))
                .map(
                  (b: {
                    id: string;
                    name: string;
                    genres: string[];
                    imageUrl: string | null;
                  }) => ({
                    id: b.id,
                    name: b.name,
                    genres: b.genres,
                    imageUrl: b.imageUrl,
                    source: "spotify" as const,
                  })
                );
              return [...prev, ...newBands];
            });
            setSpotifyImported(true);
            const newNum = parseInt(newCount);
            setSpotifyMessage(
              newNum > 0
                ? `Imported ${data.bands.length} artist${data.bands.length !== 1 ? "s" : ""} from Spotify! (${newNum} new to our catalog)`
                : `Imported ${data.bands.length} artist${data.bands.length !== 1 ? "s" : ""} from your Spotify listening history!`
            );
          } else {
            // Spotify connected but no top artists found
            setSpotifyImported(true);
            setSpotifyMessage(
              "Spotify connected but we couldn't find any top artists in your account. Try listening to more music and import again later!"
            );
          }
        })
        .catch((err) => {
          console.error("Failed to fetch Spotify matches:", err);
          setSpotifyMessage(
            "Spotify connected but we had trouble loading your matches. Try refreshing the page."
          );
        });
    } else if (spotifyStatus === "denied") {
      setSpotifyMessage(
        "Spotify access was denied. You can still add artists manually."
      );
    } else if (spotifyStatus === "error") {
      setSpotifyMessage(
        "Something went wrong with Spotify. You can still add artists manually."
      );
    }

    router.replace("/preferences", { scroll: false });
  }, [searchParams, router]);

  // ── Band browser logic ────────────────────────────────────────

  // Load popular bands when browser opens
  useEffect(() => {
    if (!showBandBrowser || popularBands.length > 0) return;

    async function loadPopular() {
      setIsLoadingPopular(true);
      try {
        const res = await fetch("/api/bands?limit=48&sortBy=popularity");
        const data = await res.json();
        setPopularBands(data.bands || []);
        setHasMorePopular((data.pagination?.totalPages || 1) > 1);
      } catch (error) {
        console.error("Failed to load bands:", error);
      } finally {
        setIsLoadingPopular(false);
      }
    }
    loadPopular();
  }, [showBandBrowser, popularBands.length]);

  const loadMorePopular = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = popularPage + 1;
      const res = await fetch(
        `/api/bands?limit=48&sortBy=popularity&page=${nextPage}`
      );
      const data = await res.json();
      setPopularBands((prev) => [...prev, ...(data.bands || [])]);
      setPopularPage(nextPage);
      setHasMorePopular(nextPage < (data.pagination?.totalPages || 1));
    } catch (error) {
      console.error("Failed to load more bands:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Load bands by genre
  useEffect(() => {
    if (!activeGenre || !showBandBrowser) {
      setGenreBands([]);
      return;
    }

    async function loadGenre() {
      setIsLoadingGenre(true);
      try {
        const res = await fetch(
          `/api/bands?limit=100&sortBy=popularity&genre=${encodeURIComponent(
            activeGenre!
          )}`
        );
        const data = await res.json();
        setGenreBands(data.bands || []);
      } catch (error) {
        console.error("Failed to load genre bands:", error);
      } finally {
        setIsLoadingGenre(false);
      }
    }
    loadGenre();
  }, [activeGenre, showBandBrowser]);

  // Debounced search
  const searchBands = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/bands/search?q=${encodeURIComponent(query)}&limit=48`
      );
      const data = await res.json();
      setSearchResults(data.bands || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!showBandBrowser || activeTab !== "search") return;
    const timer = setTimeout(() => searchBands(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchBands, activeTab, showBandBrowser]);

  // Load user's Spotify artists when tab is selected
  useEffect(() => {
    if (!showBandBrowser || activeTab !== "spotify" || spotifyLoaded) return;

    async function loadSpotifyBands() {
      setIsLoadingSpotify(true);
      try {
        const res = await fetch("/api/spotify/my-artists");
        if (!res.ok) {
          setSpotifyBands([]);
          return;
        }
        const data = await res.json();
        setSpotifyBands(data.bands || []);
      } catch (error) {
        console.error("Failed to load Spotify artists:", error);
      } finally {
        setIsLoadingSpotify(false);
        setSpotifyLoaded(true);
      }
    }
    loadSpotifyBands();
  }, [showBandBrowser, activeTab, spotifyLoaded]);

  // ── Band management ───────────────────────────────────────────

  const toggleBand = (band: BandResult) => {
    const isSelected = selectedBands.some((b) => b.id === band.id);
    if (isSelected) {
      setSelectedBands((prev) => prev.filter((b) => b.id !== band.id));
    } else {
      setSelectedBands((prev) => [
        ...prev,
        {
          id: band.id,
          name: band.name,
          genres: band.genres,
          imageUrl: band.imageUrl,
          source: "manual",
        },
      ]);
    }
  };

  const removeBand = (bandId: string) => {
    setSelectedBands((prev) => prev.filter((b) => b.id !== bandId));
  };

  // ── City management ───────────────────────────────────────────

  const addCity = (city: string, state: string) => {
    if (cityPreferences.some((p) => p.city === city && p.state === state)) return;
    setCityPreferences((prev) => [...prev, { city, state, maxRadius: 50 }]);
  };

  const removeCity = (index: number) => {
    setCityPreferences((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRadius = (index: number, radius: number) => {
    setCityPreferences((prev) =>
      prev.map((p, i) => (i === index ? { ...p, maxRadius: radius } : p))
    );
  };

  // ── Spotify connect ───────────────────────────────────────────

  const handleSpotifyConnect = async () => {
    try {
      const res = await fetch("/api/spotify/auth?returnTo=/preferences");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to connect to Spotify");
      }
    } catch {
      setError("Failed to connect to Spotify");
    }
  };

  // ── Save ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (selectedGenres.length === 0) {
      setError("Please select at least 1 genre.");
      return;
    }
    if (cityPreferences.length === 0) {
      setError("Please add at least one city.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bandPreferences: selectedBands.map((band, i) => ({
            bandId: band.id,
            maxTicketPrice: DEFAULT_TICKET_PRICE,
            priority: i + 1,
            isDreamShow: false,
          })),
          genrePreferences: selectedGenres.map((genre) => ({ genre })),
          cityPreferences,
        }),
      });

      if (!res.ok) throw new Error("Failed to save preferences");

      setSuccessMessage("Preferences saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Band browser helpers ──────────────────────────────────────

  const getDisplayBands = (): BandResult[] => {
    switch (activeTab) {
      case "popular":
        return popularBands;
      case "genres":
        return genreBands;
      case "search":
        return searchResults;
      case "spotify":
        return spotifyBands;
      default:
        return [];
    }
  };

  const isBrowserLoading =
    (activeTab === "popular" && isLoadingPopular) ||
    (activeTab === "genres" && isLoadingGenre) ||
    (activeTab === "search" && isSearching) ||
    (activeTab === "spotify" && isLoadingSpotify);

  const displayBands = getDisplayBands();

  const tabs: { id: TabId; label: string }[] = [
    { id: "popular", label: "Popular" },
    { id: "genres", label: "By Genre" },
    { id: "search", label: "Search" },
    ...(showSpotify ? [{ id: "spotify" as TabId, label: "My Spotify" }] : []),
  ];

  const availableSuggestions = SUGGESTED_CITIES.filter(
    (s) =>
      !cityPreferences.some((p) => p.city === s.city && p.state === s.state)
  );

  // ── Loading state ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/my-events"
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Your Preferences</h1>
              <p className="text-sm text-zinc-500">
                Manage your artists, genres, and locations
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || selectedGenres.length === 0}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Messages */}
      {spotifyMessage && (
        <div
          className={cn(
            "mb-4 rounded-md p-3 text-sm",
            spotifyImported
              ? "bg-green-50 text-green-700"
              : "bg-amber-50 text-amber-700"
          )}
        >
          {spotifyMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
          <Check className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      <div className="space-y-8">
        {/* ═══ SECTION 1: YOUR GENRES ═══ */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Your Genres</h2>
            {selectedGenres.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedGenres.length}
              </Badge>
            )}
          </div>

          <p className="mb-3 text-sm text-zinc-500">
            These help us recommend shows you&apos;ll love, even from artists you haven&apos;t discovered yet.
          </p>

          {/* Genre chips */}
          <div className="flex flex-wrap gap-2.5">
            {GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() =>
                    setSelectedGenres((prev) =>
                      prev.includes(genre)
                        ? prev.filter((g) => g !== genre)
                        : [...prev, genre]
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    isSelected
                      ? "bg-orange-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                  {genre}
                </button>
              );
            })}
          </div>

          {selectedGenres.length > 0 && (
            <p className="mt-2 text-xs text-zinc-400">
              {selectedGenres.length} genre{selectedGenres.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </section>

        {/* ═══ SECTION 2: YOUR ARTISTS ═══ */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold">Your Artists</h2>
              {selectedBands.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedBands.length}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {showSpotify && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSpotifyConnect}
                  className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  Import from Spotify
                </Button>
              )}
              <Button
                variant={showBandBrowser ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBandBrowser(!showBandBrowser)}
                className={
                  showBandBrowser
                    ? "bg-orange-600 hover:bg-orange-700"
                    : ""
                }
              >
                {showBandBrowser ? (
                  <>
                    <X className="mr-1 h-3 w-3" />
                    Close Browser
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Artists
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Current artist selections */}
          {selectedBands.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {selectedBands.map((band) => (
                <Badge
                  key={band.id}
                  variant="secondary"
                  className="gap-1 py-0.5 pl-2.5 pr-1 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200"
                >
                  {band.name}
                  <button
                    onClick={() => removeBand(band.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-orange-300/50"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mb-4 text-sm text-zinc-400">
              No artists selected yet — browse or import from Spotify to add some.
            </p>
          )}

          {/* Band browser (expandable) */}
          {showBandBrowser && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              {/* Tab bar */}
              <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Genre chips */}
              {activeTab === "genres" && (
                <div className="mt-3">
                  <GenreChips
                    genres={GENRES}
                    activeGenre={activeGenre}
                    onSelect={setActiveGenre}
                  />
                </div>
              )}

              {/* Search input */}
              {activeTab === "search" && (
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Search for an artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
                  )}
                </div>
              )}

              {/* Band grid */}
              <div className="mt-3 min-h-[280px]">
                {isBrowserLoading ? (
                  <div className="flex items-center justify-center py-16 text-zinc-400">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading artists...
                  </div>
                ) : displayBands.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                    {activeTab === "search" && searchQuery.length < 2 ? (
                      <p>Type at least 2 characters to search</p>
                    ) : activeTab === "genres" && !activeGenre ? (
                      <p>Select a genre above to browse artists</p>
                    ) : activeTab === "spotify" && spotifyLoaded ? (
                      <div className="text-center">
                        <p className="mb-3">No Spotify artists found</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSpotifyConnect}
                          className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                          </svg>
                          Connect Spotify to import your artists
                        </Button>
                      </div>
                    ) : (
                      <p>No artists found</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {displayBands.map((band) => (
                        <BandSelectionCard
                          key={band.id}
                          band={band}
                          isSelected={selectedBands.some(
                            (b) => b.id === band.id
                          )}
                          onToggle={() => toggleBand(band)}
                        />
                      ))}
                    </div>

                    {activeTab === "popular" && hasMorePopular && (
                      <div className="mt-4 flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadMorePopular}
                          disabled={isLoadingMore}
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            "Load More Artists"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ═══ SECTION 2: LOCATIONS ═══ */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Your Locations</h2>
          </div>

          {/* Current cities */}
          <div className="space-y-3">
            {cityPreferences.map((pref, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">
                      {pref.city}, {pref.state}
                    </span>
                  </div>
                  {cityPreferences.length > 1 && (
                    <button
                      onClick={() => removeCity(index)}
                      className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <Label>Travel radius</Label>
                    <span className="font-medium text-orange-600">
                      {pref.maxRadius} miles
                    </span>
                  </div>
                  <Slider
                    value={[pref.maxRadius]}
                    onValueChange={([value]) => updateRadius(index, value)}
                    min={10}
                    max={200}
                    step={5}
                    className="mt-2"
                  />
                  <div className="mt-1 flex justify-between text-xs text-zinc-400">
                    <span>10 mi</span>
                    <span>200 mi</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Suggested cities */}
          {availableSuggestions.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-700">
                Suggested cities
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.map((suggestion) => (
                  <Button
                    key={`${suggestion.city}-${suggestion.state}`}
                    variant="outline"
                    size="sm"
                    onClick={() => addCity(suggestion.city, suggestion.state)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {suggestion.city}, {suggestion.state}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom city input */}
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-zinc-700">
              Add another city
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const city = formData.get("city") as string;
                const state = formData.get("state") as string;
                if (city && state) {
                  addCity(city, state.toUpperCase());
                  e.currentTarget.reset();
                }
              }}
              className="flex gap-2"
            >
              <Input name="city" placeholder="City name" className="flex-1" />
              <Input
                name="state"
                placeholder="ST"
                maxLength={2}
                className="w-16"
              />
              <Button type="submit" variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>

        {/* ═══ BOTTOM SAVE BAR ═══ */}
        <div className="sticky bottom-4 flex justify-end rounded-xl border border-zinc-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <p className="text-sm text-zinc-500">
              {selectedGenres.length > 0 && `${selectedGenres.length} genre${selectedGenres.length !== 1 ? "s" : ""}, `}
              {selectedBands.length} artist{selectedBands.length !== 1 ? "s" : ""},
              {" "}
              {cityPreferences.length} location
              {cityPreferences.length !== 1 ? "s" : ""}
            </p>
            <Button
              onClick={handleSave}
              disabled={isSaving || selectedGenres.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      }
    >
      <PreferencesContent />
    </Suspense>
  );
}
