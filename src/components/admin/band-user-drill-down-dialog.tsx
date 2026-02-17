"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, DollarSign, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BandUser {
  id: string;
  name: string | null;
  email: string;
  maxTicketPrice: number;
  isDreamShow: boolean;
  priority: number;
  createdAt: string;
}

interface BandUserDrillDownDialogProps {
  bandId: string;
  bandName: string;
  demandCount: number;
  trigger: React.ReactNode;
}

export function BandUserDrillDownDialog({
  bandId,
  bandName,
  demandCount,
  trigger,
}: BandUserDrillDownDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<BandUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    async function fetchUsers() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/admin/demand/band-users?bandId=${encodeURIComponent(bandId)}`
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch users");
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [open, bandId]);

  // Compute summary stats
  const avgPrice =
    users.length > 0
      ? Math.round(
          users.reduce((sum, u) => sum + u.maxTicketPrice, 0) / users.length
        )
      : 0;
  const maxPrice =
    users.length > 0 ? Math.max(...users.map((u) => u.maxTicketPrice)) : 0;
  const minPrice =
    users.length > 0 ? Math.min(...users.map((u) => u.maxTicketPrice)) : 0;
  const dreamShowCount = users.filter((u) => u.isDreamShow).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            Users interested in {bandName}
          </DialogTitle>
          <DialogDescription>
            {demandCount} fan{demandCount !== 1 ? "s" : ""} have expressed
            interest
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            {users.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg bg-zinc-50 p-3 text-center">
                  <p className="text-lg font-bold">{users.length}</p>
                  <p className="text-xs text-zinc-500">Total Fans</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3 text-center">
                  <p className="text-lg font-bold">
                    {formatCurrency(avgPrice)}
                  </p>
                  <p className="text-xs text-zinc-500">Avg Price</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3 text-center">
                  <p className="text-lg font-bold">
                    {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
                  </p>
                  <p className="text-xs text-zinc-500">Price Range</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <p className="text-lg font-bold text-amber-700">
                    {dreamShowCount}
                  </p>
                  <p className="text-xs text-amber-600">Dream Shows</p>
                </div>
              </div>
            )}

            {/* User Table */}
            {users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Max Price</TableHead>
                    <TableHead className="text-center">Dream Show</TableHead>
                    <TableHead className="text-right">Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || "—"}
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3 text-zinc-400" />
                          {formatCurrency(user.maxTicketPrice)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.isDreamShow ? (
                          <Sparkles className="mx-auto h-4 w-4 text-amber-500" />
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-zinc-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-zinc-400">
                No users found for this band.
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
