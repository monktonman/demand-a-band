"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Music,
  SkipForward,
} from "lucide-react";
import { BandSelectionCard } from "./band-selection-card";
import { OnboardingTour } from "@/components/shared/onboarding-tour";
import type { SelectedBand } from "@/app/(main)/onboarding/page";

interface StepBandsProps {
  selectedBands: SelectedBand[];
  setSelectedBands: React.Dispatch<React.SetStateAction<SelectedBand[]>>;
  selectedGenres: string[];
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  spotifyImported?: boolean;
  onSpotifyConnect?: () => void;
}

interface BandResult {
  id: string;
  name: string;
  slug: string;
  genres: string[];
  imageUrl: string | null;
  popularity: number;
}

type TabId = "recommended" | "popular" | "search" | "spotify";

export function StepBands({
  selectedBands,
  setSelectedBands,
  selectedGenres,
  onNext,
  onBack,
  onSkip,
  spotifyImported,
  onSpotifyConnect,
}: StepBandsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("recommended");

  // Recommended tab state (pre-filtered by user's selected genres)
  const [recommendedBands, setRecommendedBands] = useState<BandResult[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);

  // Popular tab state
  const [popularBands, setPopularBands] = useState<BandResult[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [popularLoaded, setPopularLoaded] = useState(false);
  const [popularPage, setPopularPage] = useState(1);
  const [hasMorePopular, setHasMorePopular] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BandResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Spotify tab state
  const [spotifyBands, setSpotifyBands] = useState<BandResult[]>([]);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);

  // Show Spotify button only if env var is set
  const showSpotify = process.env.NEXT_PUBLIC_SPOTIFY_CONFIGURED === "true";

  // Load recommended bands based on user's selected genres
  useEffect(() => {
    async function loadRecommended() {
      setIsLoadingRecommended(true);
      try {
        // Fetch artists matching the user's selected genres
        const genreParams = selectedGenres
          .map((g) => `genre=${encodeURIComponent(g)}`)
          .join("&");
        const url = selectedGenres.length > 0
          ? `/api/bands?limit=48&sortBy=popularity&${genreParams}`
          : `/api/bands?limit=48&sortBy=popularity`;
        const res = await fetch(url);
        const data = await res.json();
        setRecommendedBands(data.bands || []);
      } catch (error) {
        console.error("Failed to load recommended bands:", error);
      } finally {
        setIsLoadingRecommended(false);
      }
    }
    loadRecommended();
  }, [selectedGenres]);

  // Load popular bands (lazy — only when tab is selected)
  useEffect(() => {
    if (activeTab !== "popular" || popularLoaded) return;

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
        setPopularLoaded(true);
      }
    }
    loadPopular();
  }, [activeTab, popularLoaded]);

  // Load more popular bands
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

  // Load user's Spotify artists when tab is selected
  useEffect(() => {
    if (activeTab !== "spotify" || spotifyLoaded) return;

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
  }, [activeTab, spotifyLoaded]);

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
    if (activeTab !== "search") return;
    const timer = setTimeout(() => searchBands(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchBands, activeTab]);

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
        },
      ]);
    }
  };

  const removeBand = (bandId: string) => {
    setSelectedBands((prev) => prev.filter((b) => b.id !== bandId));
  };

  // Tab content: get the bands to display in the grid
  const getDisplayBands = (): BandResult[] => {
    switch (activeTab) {
      case "recommended":
        return recommendedBands;
      case "popular":
        return popularBands;
      case "search":
        return searchResults;
      case "spotify":
        return spotifyBands;
      default:
        return [];
    }
  };

  const isLoading =
    (activeTab === "recommended" && isLoadingRecommended) ||
    (activeTab === "popular" && isLoadingPopular) ||
    (activeTab === "search" && isSearching) ||
    (activeTab === "spotify" && isLoadingSpotify);

  const displayBands = getDisplayBands();

  const tabs: { id: TabId; label: string }[] = [
    { id: "recommended", label: "For You" },
    { id: "popular", label: "Popular" },
    { id: "search", label: "Search" },
    ...(showSpotify
      ? [{ id: "spotify" as TabId, label: "My Spotify" }]
      : []),
  ];

  return (
    <div className="space-y-5">
      {/* Guided tour for first-time users */}
      <OnboardingTour step="bands" />

      {/* Spotify quick start (prominent, at the top) */}
      {showSpotify && !spotifyImported && onSpotifyConnect && (
        <button
          type="button"
          onClick={onSpotifyConnect}
          className="flex w-full items-center gap-4 rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-left transition-all hover:border-green-400 hover:shadow-lg"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500 shadow-md">
            <svg
              className="h-6 w-6 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-green-900">
              Quick Start with Spotify
            </p>
            <p className="text-sm text-green-700">
              Import your favorite artists automatically from your listening
              history
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-green-400" />
        </button>
      )}

      {/* Spotify connected state */}
      {spotifyImported && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
            <svg
              className="h-4 w-4 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">
              Spotify Connected
            </p>
            <p className="text-xs text-green-600">
              Artists imported from your listening history
            </p>
          </div>
        </div>
      )}

      {/* Genre context — show what genres the user picked */}
      {selectedGenres.length > 0 && (
        <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3">
          <p className="text-xs font-medium text-zinc-500 mb-1.5">
            Showing artists based on your genres:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedGenres.map((genre) => (
              <Badge
                key={genre}
                variant="secondary"
                className="bg-orange-100 text-orange-700 text-xs py-0.5"
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Current artist selections */}
      {selectedBands.length > 0 && (
        <div
          data-tour="onboarding-selections"
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
        >
          <div className="mb-2 flex items-center gap-1.5">
            <Music className="h-3.5 w-3.5 text-orange-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Selected Artists
              <span className="ml-1 text-orange-600">
                ({selectedBands.length})
              </span>
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedBands.map((band) => (
              <Badge
                key={band.id}
                variant="secondary"
                className="gap-1 bg-orange-100 py-0.5 pl-2.5 pr-1 text-xs text-orange-700 hover:bg-orange-200"
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
        </div>
      )}

      {/* Tab bar */}
      <div
        data-tour="onboarding-browse"
        className="flex gap-1 rounded-lg bg-zinc-100 p-1"
      >
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

      {/* Search input (only on search tab) */}
      {activeTab === "search" && (
        <div className="relative">
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
      <div className="min-h-[320px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-zinc-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading artists...
          </div>
        ) : displayBands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            {activeTab === "search" && searchQuery.length < 2 ? (
              <p>Type at least 2 characters to search</p>
            ) : activeTab === "spotify" && !spotifyLoaded ? (
              <p>Loading your Spotify artists...</p>
            ) : activeTab === "spotify" && spotifyLoaded ? (
              <div className="text-center">
                <p className="mb-2">No Spotify artists found</p>
                {!spotifyImported && onSpotifyConnect && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSpotifyConnect}
                    className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    Connect Spotify to import your artists
                  </Button>
                )}
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
                  isSelected={selectedBands.some((b) => b.id === band.id)}
                  onToggle={() => toggleBand(band)}
                />
              ))}
            </div>

            {/* Load more (popular tab only) */}
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

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {/* Skip option */}
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <SkipForward className="mr-1 h-4 w-4" />
            Skip for now
          </Button>

          {/* Continue with selections */}
          {selectedBands.length > 0 && (
            <Button
              onClick={onNext}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Continue ({selectedBands.length} artist
              {selectedBands.length !== 1 ? "s" : ""})
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
