"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, ChevronRight, Loader2 } from "lucide-react";
import { GENRES } from "@/lib/constants";
import { BandSelectionCard } from "./band-selection-card";
import { GenreChips } from "./genre-chips";
import type { SelectedBand } from "@/app/(main)/onboarding/page";

interface StepBandsProps {
  selectedBands: SelectedBand[];
  setSelectedBands: React.Dispatch<React.SetStateAction<SelectedBand[]>>;
  onNext: () => void;
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

type TabId = "popular" | "genres" | "search";

export function StepBands({
  selectedBands,
  setSelectedBands,
  onNext,
  spotifyImported,
  onSpotifyConnect,
}: StepBandsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("popular");

  // Popular tab state
  const [popularBands, setPopularBands] = useState<BandResult[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [popularPage, setPopularPage] = useState(1);
  const [hasMorePopular, setHasMorePopular] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Genre tab state
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [genreBands, setGenreBands] = useState<BandResult[]>([]);
  const [isLoadingGenre, setIsLoadingGenre] = useState(false);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BandResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Show Spotify button only if env var is set
  const showSpotify = typeof window !== "undefined" && process.env.NEXT_PUBLIC_SPOTIFY_CONFIGURED === "true";

  // Load popular bands
  useEffect(() => {
    async function loadPopular() {
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
  }, []);

  // Load more popular bands
  const loadMorePopular = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = popularPage + 1;
      const res = await fetch(`/api/bands?limit=48&sortBy=popularity&page=${nextPage}`);
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
    if (!activeGenre) {
      setGenreBands([]);
      return;
    }

    async function loadGenre() {
      setIsLoadingGenre(true);
      try {
        const res = await fetch(
          `/api/bands?limit=100&sortBy=popularity&genre=${encodeURIComponent(activeGenre!)}`
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
  }, [activeGenre]);

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
          maxTicketPrice: 50,
          isDreamShow: false,
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
      case "popular":
        return popularBands;
      case "genres":
        return genreBands;
      case "search":
        return searchResults;
      default:
        return [];
    }
  };

  const isLoading =
    (activeTab === "popular" && isLoadingPopular) ||
    (activeTab === "genres" && isLoadingGenre) ||
    (activeTab === "search" && isSearching);

  const displayBands = getDisplayBands();

  const tabs: { id: TabId; label: string }[] = [
    { id: "popular", label: "Popular" },
    { id: "genres", label: "By Genre" },
    { id: "search", label: "Search" },
  ];

  return (
    <div className="space-y-5">
      {/* Selected bands bar */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">
            {selectedBands.length === 0
              ? "No bands selected yet"
              : `${selectedBands.length} band${selectedBands.length !== 1 ? "s" : ""} selected`}
          </h3>
          <span className="text-xs text-zinc-400">
            {selectedBands.length < 3
              ? `${3 - selectedBands.length} more needed`
              : "Ready to continue!"}
          </span>
        </div>
        {selectedBands.length > 0 ? (
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
        ) : (
          <p className="text-xs text-zinc-400">
            Browse below or connect Spotify to get started
          </p>
        )}
      </div>

      {/* Spotify import button */}
      {showSpotify && !spotifyImported && onSpotifyConnect && (
        <button
          type="button"
          onClick={onSpotifyConnect}
          className="flex w-full items-center gap-3 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-left transition-all hover:border-green-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900">Import from Spotify</p>
            <p className="text-xs text-green-700">
              Auto-discover bands from your listening history
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-green-400" />
        </button>
      )}

      {/* Spotify connected state */}
      {spotifyImported && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Spotify Connected</p>
            <p className="text-xs text-green-600">
              Bands imported from your listening history
            </p>
          </div>
        </div>
      )}

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

      {/* Genre chips (only on genre tab) */}
      {activeTab === "genres" && (
        <GenreChips
          genres={GENRES}
          activeGenre={activeGenre}
          onSelect={setActiveGenre}
        />
      )}

      {/* Search input (only on search tab) */}
      {activeTab === "search" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search for a band or artist..."
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
            Loading bands...
          </div>
        ) : displayBands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            {activeTab === "search" && searchQuery.length < 2 ? (
              <p>Type at least 2 characters to search</p>
            ) : activeTab === "genres" && !activeGenre ? (
              <p>Select a genre above to browse bands</p>
            ) : (
              <p>No bands found</p>
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
                    "Load More Bands"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Next button */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
        <p className="text-sm text-zinc-400">
          {selectedBands.length < 3
            ? `Select at least ${3 - selectedBands.length} more band${3 - selectedBands.length !== 1 ? "s" : ""}`
            : `${selectedBands.length} bands selected`}
        </p>
        <Button
          onClick={onNext}
          disabled={selectedBands.length < 3}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Continue
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
