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
import { Users, Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { UserRole } from "@prisma/client";

interface SerializedUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  onboarded: boolean;
  bandPrefs: number;
  pledges: number;
  createdAt: string;
}

const ROLES: UserRole[] = ["FAN", "OPERATOR", "ADMIN"];

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-purple-600",
  OPERATOR: "bg-blue-600",
  FAN: "",
};

export function AdminUsersClient({ users }: { users: SerializedUser[] }) {
  const router = useRouter();

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<SerializedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit role state
  const [editTarget, setEditTarget] = useState<SerializedUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("FAN");
  const [isSaving, setIsSaving] = useState(false);

  // Create user state
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "FAN" as UserRole,
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }

      toast.success(`${deleteTarget.name || deleteTarget.email} has been deleted`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditRole = async () => {
    if (!editTarget) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      toast.success(
        `${editTarget.name || editTarget.email} is now ${editRole.toLowerCase()}`
      );
      setEditTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error("Email and password are required");
      return;
    }
    setIsCreating(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }

      toast.success(`User ${newUser.email} created`);
      setShowCreate(false);
      setNewUser({ name: "", email: "", password: "", role: "FAN" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-zinc-500">{users.length} registered users</p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            User List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Onboarded</TableHead>
                <TableHead className="text-right">Band Prefs</TableHead>
                <TableHead className="text-right">Pledges</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-orange-600 hover:underline"
                    >
                      {user.name || user.email}
                    </Link>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "FAN" ? "outline" : "default"}
                      className={ROLE_COLORS[user.role]}
                    >
                      {user.role.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {user.onboarded ? (
                      <Badge className="bg-green-600">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{user.bandPrefs}</TableCell>
                  <TableCell className="text-right">{user.pledges}</TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-600 hover:text-zinc-800"
                        onClick={() => {
                          setEditTarget(user);
                          setEditRole(user.role);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              Change role for{" "}
              <strong>{editTarget?.name || editTarget?.email}</strong>
            </p>
            <div className="flex gap-2">
              {ROLES.map((role) => (
                <Button
                  key={role}
                  variant={editRole === role ? "default" : "outline"}
                  size="sm"
                  className={editRole === role ? "bg-orange-600 hover:bg-orange-700" : ""}
                  onClick={() => setEditRole(role)}
                >
                  {role.toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleEditRole}
              disabled={isSaving || editRole === editTarget?.role}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            Are you sure you want to delete{" "}
            <strong>
              {deleteTarget?.name || deleteTarget?.email}
            </strong>
            ? This will remove all their preferences, pledges, and data.
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

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="new-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="new-password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, password: e.target.value }))
                }
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <Label>Role</Label>
              <div className="mt-1 flex gap-2">
                {ROLES.map((role) => (
                  <Button
                    key={role}
                    variant={newUser.role === role ? "default" : "outline"}
                    size="sm"
                    className={
                      newUser.role === role
                        ? "bg-orange-600 hover:bg-orange-700"
                        : ""
                    }
                    onClick={() => setNewUser((p) => ({ ...p, role }))}
                  >
                    {role.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleCreate}
              disabled={isCreating || !newUser.email || !newUser.password}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
