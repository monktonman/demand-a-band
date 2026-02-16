"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Music2, Sparkles, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface BandWithStats {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  demandCount: number;
  eventCount: number;
  avgPrice: number;
  dreamShowCount: number;
}

export function AdminBandsClient({ bands }: { bands: BandWithStats[] }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<BandWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/bands/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete band");
      }

      toast.success(`${deleteTarget.name} has been deleted`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete band");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bands</h1>
        <p className="text-zinc-500">{bands.length} bands in the database</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-orange-600" />
            Band Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Band</TableHead>
                <TableHead>Genres</TableHead>
                <TableHead className="text-right">Popularity</TableHead>
                <TableHead className="text-right">Demand</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">Dream Shows</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bands.map((band) => (
                <TableRow key={band.id}>
                  <TableCell className="font-medium">{band.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {band.genres.slice(0, 3).map((g) => (
                        <Badge key={g} variant="outline" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{band.popularity}</TableCell>
                  <TableCell className="text-right">
                    {band.demandCount > 0 ? (
                      <Badge className="bg-orange-600">{band.demandCount}</Badge>
                    ) : (
                      <span className="text-zinc-300">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {band.avgPrice > 0 ? formatCurrency(band.avgPrice) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {band.dreamShowCount > 0 ? (
                      <Badge className="gap-1 bg-amber-500">
                        <Sparkles className="h-3 w-3" />
                        {band.dreamShowCount}
                      </Badge>
                    ) : (
                      <span className="text-zinc-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteTarget(band)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Band</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            {deleteTarget && deleteTarget.eventCount > 0 && (
              <span className="mt-1 block text-amber-600">
                This band has {deleteTarget.eventCount} event(s). You may not be
                able to delete if any are active.
              </span>
            )}
            {deleteTarget && deleteTarget.demandCount > 0 && (
              <span className="mt-1 block text-amber-600">
                {deleteTarget.demandCount} user preference(s) will also be removed.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
