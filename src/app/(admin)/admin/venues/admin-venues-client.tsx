"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MapPin, Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { GENRES, VENUE_TYPES } from "@/lib/constants";
import type { VenueOwnership } from "@prisma/client";

interface SerializedVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number;
  venueType: string;
  genres: string[];
  ownership: VenueOwnership;
  eventCount: number;
}

const OWNERSHIP_OPTIONS: VenueOwnership[] = ["INDEPENDENT", "CHAIN", "NONPROFIT"];
const OWNERSHIP_COLORS: Record<VenueOwnership, string> = {
  INDEPENDENT: "border-green-300 text-green-700",
  CHAIN: "border-purple-300 text-purple-700",
  NONPROFIT: "border-blue-300 text-blue-700",
};

const emptyVenue = {
  name: "",
  address: "",
  city: "",
  state: "MD",
  zipCode: "",
  capacity: "200",
  venueType: "Club",
  genres: [] as string[],
  ownership: "INDEPENDENT" as VenueOwnership,
};

export function AdminVenuesClient({
  venues,
  readOnly = false,
}: {
  venues: SerializedVenue[];
  readOnly?: boolean;
}) {
  const router = useRouter();

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<SerializedVenue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit
  const [editTarget, setEditTarget] = useState<SerializedVenue | null>(null);
  const [editForm, setEditForm] = useState(emptyVenue);
  const [isSaving, setIsSaving] = useState(false);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyVenue);
  const [isCreating, setIsCreating] = useState(false);

  const openEdit = (venue: SerializedVenue) => {
    setEditTarget(venue);
    setEditForm({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      zipCode: venue.zipCode,
      capacity: String(venue.capacity),
      venueType: venue.venueType,
      genres: venue.genres,
      ownership: venue.ownership,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/venues/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete venue");
      }
      toast.success(`${deleteTarget.name} has been deleted`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete venue");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/venues/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          capacity: Number(editForm.capacity),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update venue");
      }
      toast.success(`${editForm.name} has been updated`);
      setEditTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update venue");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.city || !createForm.state) {
      toast.error("Name, city, and state are required");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          capacity: Number(createForm.capacity),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create venue");
      }
      toast.success(`${createForm.name} has been created`);
      setShowCreate(false);
      setCreateForm(emptyVenue);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create venue");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleGenre = (
    genres: string[],
    genre: string,
    setter: (fn: (p: typeof emptyVenue) => typeof emptyVenue) => void
  ) => {
    setter((p) => ({
      ...p,
      genres: genres.includes(genre)
        ? genres.filter((g) => g !== genre)
        : [...genres, genre],
    }));
  };

  const VenueFormFields = ({
    form,
    setForm,
  }: {
    form: typeof emptyVenue;
    setForm: React.Dispatch<React.SetStateAction<typeof emptyVenue>>;
  }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="venue-name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="venue-name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Venue name"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="venue-address">Address</Label>
          <Input
            id="venue-address"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="123 Main St"
          />
        </div>
        <div>
          <Label htmlFor="venue-city">
            City <span className="text-red-500">*</span>
          </Label>
          <Input
            id="venue-city"
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            placeholder="Baltimore"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="venue-state">
              State <span className="text-red-500">*</span>
            </Label>
            <Input
              id="venue-state"
              value={form.state}
              onChange={(e) =>
                setForm((p) => ({ ...p, state: e.target.value }))
              }
              placeholder="MD"
              maxLength={2}
            />
          </div>
          <div>
            <Label htmlFor="venue-zip">Zip</Label>
            <Input
              id="venue-zip"
              value={form.zipCode}
              onChange={(e) =>
                setForm((p) => ({ ...p, zipCode: e.target.value }))
              }
              placeholder="21201"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="venue-capacity">Capacity</Label>
          <Input
            id="venue-capacity"
            type="number"
            value={form.capacity}
            onChange={(e) =>
              setForm((p) => ({ ...p, capacity: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Venue Type</Label>
          <select
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
            value={form.venueType}
            onChange={(e) =>
              setForm((p) => ({ ...p, venueType: e.target.value }))
            }
          >
            {VENUE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label>Ownership</Label>
        <div className="mt-1 flex gap-2">
          {OWNERSHIP_OPTIONS.map((o) => (
            <Button
              key={o}
              type="button"
              variant={form.ownership === o ? "default" : "outline"}
              size="sm"
              className={
                form.ownership === o ? "bg-orange-600 hover:bg-orange-700" : ""
              }
              onClick={() => setForm((p) => ({ ...p, ownership: o }))}
            >
              {o.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label>Genres</Label>
        <div className="mt-1 flex flex-wrap gap-1">
          {GENRES.map((genre) => (
            <Badge
              key={genre}
              variant={form.genres.includes(genre) ? "default" : "outline"}
              className={
                form.genres.includes(genre)
                  ? "cursor-pointer bg-orange-600 hover:bg-orange-700"
                  : "cursor-pointer"
              }
              onClick={() => toggleGenre(form.genres, genre, setForm)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{readOnly ? "My Venues" : "Venues"}</h1>
          <p className="text-zinc-500">
            {venues.length} venue{venues.length !== 1 ? "s" : ""}{readOnly ? " assigned to you" : " in the Baltimore DMA"}
          </p>
        </div>
        {!readOnly && (
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Venue
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            Venue Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead>Genres</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead className="text-right">Events</TableHead>
                {!readOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{venue.name}</p>
                      <p className="text-xs text-zinc-400">{venue.address}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {venue.city}, {venue.state}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{venue.venueType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {venue.capacity.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {venue.genres.slice(0, 3).map((g) => (
                        <Badge key={g} variant="secondary" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={OWNERSHIP_COLORS[venue.ownership] || ""}
                    >
                      {venue.ownership.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {venue.eventCount}
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-600 hover:text-zinc-800"
                          onClick={() => openEdit(venue)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(venue)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Venue Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
          </DialogHeader>
          <VenueFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleEdit}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Venue</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong>?
            {deleteTarget && deleteTarget.eventCount > 0 && (
              <span className="mt-1 block text-amber-600">
                This venue has {deleteTarget.eventCount} event(s). You may not
                be able to delete if any are active.
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

      {/* Create Venue Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Venue</DialogTitle>
          </DialogHeader>
          <VenueFormFields form={createForm} setForm={setCreateForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleCreate}
              disabled={
                isCreating ||
                !createForm.name ||
                !createForm.city ||
                !createForm.state
              }
            >
              {isCreating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Venue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
