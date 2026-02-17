"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Search,
  Loader2,
  ArrowUpRight,
  Users,
  Music2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { BandUserDrillDownDialog } from "./band-user-drill-down-dialog";

interface BandWithDemand {
  id: string;
  name: string;
  slug: string;
  genres: string[];
  imageUrl: string | null;
  popularity: number | null;
  demandCount: number;
  avgPrice: number;
  maxPrice: number;
  dreamShowCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SpotifyResult {
  spotifyId: string;
  name: string;
  genres: string[];
  imageUrl: string | null;
  popularity: number;
  spotifyUrl: string;
}

interface GenreDrillDownPanelProps {
  genre: string;
  userRole: string;
  onClose: () => void;
}

function buildPromoteUrl(band: BandWithDemand) {
  return `/admin/events/new?bandId=${band.id}&bandName=${encodeURIComponent(band.name)}&avgPrice=${band.avgPrice}&demandCount=${band.demandCount}&dreamShowCount=${band.dreamShowCount}`;
}

export function GenreDrillDownPanel({
  genre,
  userRole,
  onClose,
}: GenreDrillDownPanelProps) {
  const isAdmin = userRole === "ADMIN";

  // Band search/browse state
  const [bands, setBands] = useState<BandWithDemand[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"demand" | "name" | "popularity">(
    "demand"
  );
  const [page, setPage] = useState(1);

  // Spotify discovery state
  const [spotifyQuery, setSpotifyQuery] = useState("");
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyResult, setSpotifyResult] = useState<SpotifyResult | null>(
    null
  );
  const [spotifyExists, setSpotifyExists] = useState(false);
  const [spotifyCatalogId, setSpotifyCatalogId] = useState<string | null>(null);
  const [spotifyError, setSpotifyError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch bands when genre, search, sort, or page changes
  useEffect(() => {
    async function fetchBands() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          genre,
          page: String(page),
          limit: "15",
          sortBy,
        });
        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const res = await fetch(`/api/admin/demand/bands?${params}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch bands");
        }
        const data = await res.json();
        setBands(data.bands || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchBands();
  }, [genre, debouncedSearch, sortBy, page]);

  // Spotify search
  async function handleSpotifySearch() {
    if (!spotifyQuery.trim() || spotifyQuery.trim().length < 2) return;

    setSpotifyLoading(true);
    setSpotifyError("");
    setSpotifyResult(null);
    setSpotifyExists(false);
    setSpotifyCatalogId(null);
    setImportSuccess(false);

    try {
      const res = await fetch(
        `/api/admin/spotify-search?q=${encodeURIComponent(spotifyQuery.trim())}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Search failed");
      }
      const data = await res.json();
      setSpotifyResult(data.spotifyResult);
      setSpotifyExists(data.existsInCatalog || false);
      setSpotifyCatalogId(data.catalogBandId || null);
    } catch (err) {
      setSpotifyError(
        err instanceof Error ? err.message : "Spotify search failed"
      );
    } finally {
      setSpotifyLoading(false);
    }
  }

  // Import from Spotify
  async function handleSpotifyImport() {
    if (!spotifyResult) return;

    setImporting(true);
    setSpotifyError("");

    try {
      const res = await fetch("/api/admin/spotify-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotifyId: spotifyResult.spotifyId,
          name: spotifyResult.name,
          genres: spotifyResult.genres,
          imageUrl: spotifyResult.imageUrl,
          popularity: spotifyResult.popularity,
          spotifyUrl: spotifyResult.spotifyUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }

      setImportSuccess(true);

      // Refresh the band list to show the new band
      const params = new URLSearchParams({
        genre,
        page: "1",
        limit: "15",
        sortBy,
      });
      const refreshRes = await fetch(`/api/admin/demand/bands?${params}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setBands(refreshData.bands || []);
        setPagination(refreshData.pagination || null);
        setPage(1);
      }
    } catch (err) {
      setSpotifyError(
        err instanceof Error ? err.message : "Import failed"
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Music2 className="h-5 w-5 text-orange-600" />
            {genre}
          </CardTitle>
          <CardDescription>
            {pagination
              ? `${pagination.total} band${pagination.total !== 1 ? "s" : ""} in this genre`
              : "Loading..."}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bands in this genre..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500 mr-1">Sort:</span>
            {(["demand", "name", "popularity"] as const).map((s) => (
              <Button
                key={s}
                variant={sortBy === s ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSortBy(s);
                  setPage(1);
                }}
                className={
                  sortBy === s
                    ? "bg-orange-600 hover:bg-orange-700 text-xs h-7"
                    : "text-xs h-7"
                }
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          </div>
        ) : bands.length > 0 ? (
          <>
            {/* Band Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Band</TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead className="text-right">Fans</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Max Price</TableHead>
                  <TableHead className="text-right">Dream Shows</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bands.map((band) => (
                  <TableRow key={band.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {band.imageUrl ? (
                          <img
                            src={band.imageUrl}
                            alt={band.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
                            <Music2 className="h-4 w-4 text-zinc-400" />
                          </div>
                        )}
                        <span className="font-medium">{band.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {band.genres.slice(0, 2).map((g) => (
                          <Badge
                            key={g}
                            variant="outline"
                            className="text-xs"
                          >
                            {g}
                          </Badge>
                        ))}
                        {band.genres.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{band.genres.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {band.demandCount > 0 ? (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                          {band.demandCount}
                        </Badge>
                      ) : (
                        <span className="text-zinc-300">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {band.demandCount > 0
                        ? formatCurrency(band.avgPrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {band.demandCount > 0
                        ? formatCurrency(band.maxPrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {band.dreamShowCount > 0 ? (
                        <Badge className="bg-amber-500">
                          {band.dreamShowCount}
                        </Badge>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && band.demandCount > 0 && (
                          <BandUserDrillDownDialog
                            bandId={band.id}
                            bandName={band.name}
                            demandCount={band.demandCount}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs text-zinc-500 hover:text-zinc-700"
                              >
                                <Users className="h-3 w-3" />
                                Users
                              </Button>
                            }
                          />
                        )}
                        <Link href={buildPromoteUrl(band)}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 text-xs"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                            Create Event
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-zinc-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-6 text-center text-zinc-400">
            {debouncedSearch
              ? `No bands found matching "${debouncedSearch}" in ${genre}`
              : `No bands found in ${genre}`}
          </div>
        )}

        {/* Spotify Discovery Section */}
        <div className="border-t pt-4">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-zinc-700">
              Discover New Artists
            </h4>
            <p className="text-xs text-zinc-400">
              Search Spotify to find and add artists not yet in the catalog
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={spotifyQuery}
                onChange={(e) => {
                  setSpotifyQuery(e.target.value);
                  setImportSuccess(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSpotifySearch()}
                placeholder="Search Spotify for an artist..."
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleSpotifySearch}
              disabled={
                spotifyLoading || !spotifyQuery.trim() || spotifyQuery.trim().length < 2
              }
              variant="outline"
              className="gap-1"
            >
              {spotifyLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Search Spotify
            </Button>
          </div>

          {/* Spotify Error */}
          {spotifyError && (
            <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
              {spotifyError}
            </div>
          )}

          {/* Spotify Result */}
          {spotifyResult && (
            <div className="mt-3 rounded-lg border bg-zinc-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {spotifyResult.imageUrl ? (
                    <img
                      src={spotifyResult.imageUrl}
                      alt={spotifyResult.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200">
                      <Music2 className="h-6 w-6 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{spotifyResult.name}</p>
                    <p className="text-xs text-zinc-500">
                      {spotifyResult.genres.slice(0, 4).join(", ") || "No genres listed"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Popularity: {spotifyResult.popularity}/100
                    </p>
                  </div>
                </div>

                <div>
                  {importSuccess ? (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Added!
                    </div>
                  ) : spotifyExists ? (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200"
                    >
                      Already in catalog
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSpotifyImport}
                      disabled={importing}
                      className="gap-1 bg-orange-600 hover:bg-orange-700"
                    >
                      {importing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Add to Catalog
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No Spotify Result */}
          {!spotifyLoading &&
            spotifyQuery.trim().length >= 2 &&
            spotifyResult === null &&
            !spotifyError && (
              <div className="mt-2 text-xs text-zinc-400">
                No results found on Spotify for &ldquo;{spotifyQuery}&rdquo;
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
