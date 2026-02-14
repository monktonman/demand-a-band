"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, X, Music2, ChevronRight, Loader2 } from "lucide-react";
import type { SelectedBand } from "@/app/(main)/onboarding/page";

interface StepBandsProps {
  selectedBands: SelectedBand[];
  setSelectedBands: React.Dispatch<React.SetStateAction<SelectedBand[]>>;
  onNext: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  genres: string[];
  imageUrl: string | null;
  popularity: number;
}

export function StepBands({
  selectedBands,
  setSelectedBands,
  onNext,
}: StepBandsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [allBands, setAllBands] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(true);

  // Load all bands on mount
  useEffect(() => {
    async function loadBands() {
      try {
        const res = await fetch("/api/bands");
        const data = await res.json();
        setAllBands(data.bands);
      } catch (error) {
        console.error("Failed to load bands:", error);
      } finally {
        setIsLoadingAll(false);
      }
    }
    loadBands();
  }, []);

  // Debounced search
  const searchBands = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/bands/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setSearchResults(data.bands);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchBands(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchBands]);

  const toggleBand = (band: SearchResult) => {
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

  const displayBands =
    searchQuery.length >= 2 ? searchResults : allBands.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Selected bands */}
      {selectedBands.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-zinc-700">
            Selected ({selectedBands.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedBands.map((band) => (
              <Badge
                key={band.id}
                variant="secondary"
                className="gap-1 bg-orange-100 py-1 pl-3 pr-1 text-orange-700 hover:bg-orange-200"
              >
                {band.name}
                <button
                  onClick={() => removeBand(band.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-orange-300/50"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
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

      {/* Band list */}
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border bg-zinc-50 p-2">
        {isLoadingAll && searchQuery.length < 2 ? (
          <div className="flex items-center justify-center py-8 text-zinc-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading bands...
          </div>
        ) : displayBands.length === 0 ? (
          <div className="py-8 text-center text-zinc-400">
            {searchQuery.length >= 2
              ? "No bands found. Try a different search."
              : "Start typing to search for bands..."}
          </div>
        ) : (
          displayBands.map((band) => {
            const isSelected = selectedBands.some((b) => b.id === band.id);
            return (
              <Card
                key={band.id}
                className={`flex cursor-pointer items-center gap-3 p-3 transition-colors ${
                  isSelected
                    ? "border-orange-300 bg-orange-50"
                    : "hover:bg-white"
                }`}
                onClick={() => toggleBand(band)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200">
                  <Music2 className="h-5 w-5 text-zinc-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{band.name}</p>
                  <p className="text-xs text-zinc-500">
                    {band.genres.slice(0, 3).join(" / ")}
                  </p>
                </div>
                {isSelected && (
                  <Badge className="bg-orange-600">Selected</Badge>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Hint text */}
      <p className="text-center text-sm text-zinc-400">
        Select at least 3 bands to continue.{" "}
        {searchQuery.length < 2 && "Showing popular bands."}
      </p>

      {/* Next button */}
      <div className="flex justify-end">
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
