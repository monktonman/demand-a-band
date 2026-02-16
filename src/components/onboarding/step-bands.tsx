"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, ChevronRight, Loader2, Music, Sliders } from "lucide-react";
import { GENRES } from "@/lib/constants";
import { BandSelectionCard } from "./band-selection-card";
import { GenreChips } from "./genre-chips";
import { GenrePreferenceSelector } from "./genre-preference-selector";
import { OnboardingTour } from "@/components/shared/onboarding-tour";
import type { SelectedBand } from "@/app/(main)/onboarding/page";

interface StepBandsProps {
  selectedBands: SelectedBand[];
  setSelectedBands: React.Dispatch<React.SetStateAction<SelectedBand[]>>;
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
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

type TabId = "popular" | "genres" | "search" | "spotify";

export function StepBands({
  selectedBands,
  setSelectedBands,
  selectedGenres,
  onToggleGenre,
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

  // Spotify tab state
  const [spotifyBands, setSpotifyBands] = useState<BandResult[]>([]);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);

  // Show Spotify button only if env var is set
  const showSpotify = process.env.NEXT_PUBLIC_SPOTIFY_CONFIGURED === "true";

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

  const isLoading =
    (activeTab === "popular" && isLoadingPopular) ||
    (activeTab === "genres" && isLoadingGenre) ||
    (activeTab === "search" && isSearching) ||
    (activeTab === "spotify" && isLoadingSpotify);

  const displayBands = getDisplayBands();

  const tabs: { id: TabId; label: string; icon?: string }[] = [
    { id: "popular", label: "Popular" },
    { id: "genres", label: "By Genre" },
    { id: "search", label: "Search" },
    ...(showSpotify ? [{ id: "spotify" as TabId, label: "My Spotify" }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Guided tour for first-time users */}
      <OnboardingTour step="bands" />

      {/* ── Concept explainer ── */}
      <div data-tour="onboarding-concept" className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4">
        <p className="text-sm text-zinc-700 leading-relaxed">
          <span className="font-semibold text-orange-700">How it works:</span>{" "}
          Tell us your favorite artists and genres. When enough fans demand the same artist, we&apos;ll work to book the show in Baltimore. Your picks directly influence which artists come to town!
        </p>
      </div>

      {/* ── Spotify quick start (prominent, at the top) ── */}
      {showSpotify && !spotifyImported && onSpotifyConnect && (
        <button
          type="button"
          onClick={onSpotifyConnect}
          className="flex w-full items-center gap-4 rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-left transition-all hover:border-green-400 hover:shadow-lg"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500 shadow-md">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-green-900">Quick Start with Spotify</p>
            <p className="text-sm text-green-700">
              Import your favorite artists automatically from your listening history
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-green-400" />
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
              Artists imported from your listening history
            </p>
          </div>
        </div>
      )}

      {/* ── Current selections summary ── */}
      <div data-tour="onboarding-selections" className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700">Your Selections</h3>
          <span className="text-xs text-zinc-400">
            {selectedBands.length < 3
              ? `Select at least ${3 - selectedBands.length} more artist${3 - selectedBands.length !== 1 ? "s" : ""}`
              : "Ready to continue!"}
          </span>
        </div>

        {/* Genre selections */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-zinc-500" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Genres
              {selectedGenres.length > 0 && (
                <span className="ml-1 text-orange-600">({selectedGenres.length})</span>
              )}
            </h4>
          </div>
          {selectedGenres.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="gap-1 py-0.5 pl-2.5 pr-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200"
                >
                  {genre}
                  <button
                    onClick={() => onToggleGenre(genre)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-purple-300/50"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400">No genres yet — pick some below (optional)</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-200" />

        {/* Band selections */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Music className="h-3.5 w-3.5 text-zinc-500" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Artists
              {selectedBands.length > 0 && (
                <span className="ml-1 text-orange-600">({selectedBands.length})</span>
              )}
            </h4>
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
      </div>

      {/* ── Genre preference picker ── */}
      <div data-tour="onboarding-genres">
        <GenrePreferenceSelector
          selectedGenres={selectedGenres}
          onToggle={onToggleGenre}
        />
      </div>

      {/* Tab bar */}
      <div data-tour="onboarding-browse" className="flex gap-1 rounded-lg bg-zinc-100 p-1">
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
            ) : activeTab === "genres" && !activeGenre ? (
              <p>Select a genre above to browse artists</p>
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

      {/* Next button */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
        <p className="text-sm text-zinc-400">
          {selectedBands.length < 3
            ? `Select at least ${3 - selectedBands.length} more artist${3 - selectedBands.length !== 1 ? "s" : ""}`
            : `${selectedGenres.length > 0 ? `${selectedGenres.length} genre${selectedGenres.length !== 1 ? "s" : ""}, ` : ""}${selectedBands.length} artist${selectedBands.length !== 1 ? "s" : ""} selected`}
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
