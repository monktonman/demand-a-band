"use client";

import { useState, useEffect, useCallback } from "react";
import { BandCard } from "@/components/bands/band-card";
import { BandListItem } from "@/components/bands/band-list-item";
import { Button } from "@/components/ui/button";
import {
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Music,
  SlidersHorizontal,
  X,
  ArrowUpDown,
} from "lucide-react";

type Band = {
  id: string;
  name: string;
  slug: string;
  genres: string[];
  popularity: number | null;
  monthlyListeners: number | null;
  _count: { userPreferences: number; events: number };
};

type ViewMode = "grid" | "list";
type SortBy = "popularity" | "name" | "demand";
type SortOrder = "asc" | "desc";

const ITEMS_PER_PAGE = 48;

export default function BandsPage() {
  const [bands, setBands] = useState<Band[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("popularity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [selectedGenre, sortBy, sortOrder]);

  const fetchBands = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedGenre) params.set("genre", selectedGenre);

      const res = await fetch(`/api/bands?${params}`);
      const data = await res.json();

      setBands(data.bands);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      if (data.genres) setGenres(data.genres);
    } catch (error) {
      console.error("Failed to fetch bands:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedGenre, sortBy, sortOrder]);

  useEffect(() => {
    fetchBands();
  }, [fetchBands]);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedGenre("");
    setSortBy("popularity");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters = debouncedSearch || selectedGenre || sortBy !== "popularity" || sortOrder !== "desc";

  const startIndex = (page - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(page * ITEMS_PER_PAGE, total);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Browse Artists</h1>
        <p className="mt-1 text-zinc-500">
          Discover {total.toLocaleString()} artists — demand the ones you want in Baltimore
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 space-y-3">
        {/* Search + View Toggle row */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search artists by name or genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 ${showFilters ? "border-orange-300 bg-orange-50 text-orange-700" : ""}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] text-white">
                !
              </span>
            )}
          </Button>

          {/* View toggle */}
          <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center justify-center h-10 w-10 transition-colors ${
                view === "grid"
                  ? "bg-orange-600 text-white"
                  : "bg-white text-zinc-400 hover:text-zinc-600"
              }`}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center justify-center h-10 w-10 border-l border-zinc-200 transition-colors ${
                view === "list"
                  ? "bg-orange-600 text-white"
                  : "bg-white text-zinc-400 hover:text-zinc-600"
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters row (collapsible) */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
            {/* Genre filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-orange-400"
              >
                <option value="">All genres</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-orange-400"
              >
                <option value="popularity">Popularity</option>
                <option value="name">Name</option>
                <option value="demand">Fan Demand</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-600 hover:bg-zinc-50"
                title={sortOrder === "desc" ? "Descending" : "Ascending"}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortOrder === "desc" ? "High → Low" : "Low → High"}
              </button>
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results info */}
      <div className="mb-4 flex items-center justify-between text-sm text-zinc-500">
        <span>
          {total > 0
            ? `Showing ${startIndex}–${endIndex} of ${total.toLocaleString()} artists`
            : "No artists found"}
        </span>
        {selectedGenre && (
          <button
            onClick={() => setSelectedGenre("")}
            className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200"
          >
            {selectedGenre}
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className={view === "grid"
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "space-y-2"
        }>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`animate-pulse rounded-lg bg-zinc-100 ${
                view === "grid" ? "h-52" : "h-16"
              }`}
            />
          ))}
        </div>
      ) : bands.length === 0 ? (
        <div className="py-24 text-center">
          <Music className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
          <h2 className="text-xl font-semibold text-zinc-700">No artists found</h2>
          <p className="mt-2 text-zinc-500">
            Try adjusting your search or filters.
          </p>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="mt-4"
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bands.map((band) => (
            <BandCard key={band.id} band={band} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* List header */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
            <span className="w-8 text-center">#</span>
            <span className="w-10" /> {/* icon spacer */}
            <span className="flex-1">Artist</span>
            <span className="hidden sm:block w-24 text-right">Listeners</span>
            <span className="hidden md:block w-32">Popularity</span>
            <span className="hidden lg:block w-20">Demand</span>
            <span className="w-28 text-right">Action</span>
          </div>
          {bands.map((band, i) => (
            <BandListItem
              key={band.id}
              band={band}
              index={startIndex - 1 + i}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {generatePageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-zinc-400">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
                    p === page
                      ? "bg-orange-600 text-white font-medium"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}
