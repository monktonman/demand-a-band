"use client";

import { useState, useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquarePlus,
  Trash2,
  Loader2,
  Bug,
  Lightbulb,
  MessageCircle,
  Circle,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import type { FeedbackStatus } from "@prisma/client";

interface SerializedFeedback {
  id: string;
  page: string;
  category: string;
  message: string;
  status: FeedbackStatus;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  bug: {
    label: "Bug",
    icon: <Bug className="h-3 w-3" />,
    color: "bg-red-100 text-red-800",
  },
  feature: {
    label: "Feature",
    icon: <Lightbulb className="h-3 w-3" />,
    color: "bg-amber-100 text-amber-800",
  },
  general: {
    label: "General",
    icon: <MessageCircle className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-800",
  },
};

const STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  NEW: {
    label: "New",
    icon: <Circle className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  },
  REVIEWED: {
    label: "Reviewed",
    icon: <Eye className="h-3 w-3" />,
    color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  },
  DONE: {
    label: "Done",
    icon: <CheckCircle2 className="h-3 w-3" />,
    color: "bg-green-100 text-green-800 hover:bg-green-200",
  },
  DISMISSED: {
    label: "Dismissed",
    icon: <XCircle className="h-3 w-3" />,
    color: "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
  },
};

const ALL_STATUSES: FeedbackStatus[] = ["NEW", "REVIEWED", "DONE", "DISMISSED"];

export function AdminFeedbackClient({
  feedback,
}: {
  feedback: SerializedFeedback[];
}) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<SerializedFeedback | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredFeedback = useMemo(() => {
    let result = feedback;
    if (categoryFilter !== "all") {
      result = result.filter((f) => f.category === categoryFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((f) => f.status === statusFilter);
    }
    return result;
  }, [feedback, categoryFilter, statusFilter]);

  const categoryCounts = useMemo(
    () => ({
      all: feedback.length,
      bug: feedback.filter((f) => f.category === "bug").length,
      feature: feedback.filter((f) => f.category === "feature").length,
      general: feedback.filter((f) => f.category === "general").length,
    }),
    [feedback]
  );

  const statusCounts = useMemo(
    () => ({
      all: feedback.length,
      NEW: feedback.filter((f) => f.status === "NEW").length,
      REVIEWED: feedback.filter((f) => f.status === "REVIEWED").length,
      DONE: feedback.filter((f) => f.status === "DONE").length,
      DISMISSED: feedback.filter((f) => f.status === "DISMISSED").length,
    }),
    [feedback]
  );

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      toast.success(`Marked as ${STATUS_CONFIG[newStatus].label.toLowerCase()}`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/feedback/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete feedback");
      }
      toast.success("Feedback entry deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete feedback"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          <p className="text-zinc-500">
            {feedback.length} feedback entries from users
          </p>
        </div>
        {statusCounts.NEW > 0 && (
          <Badge className="bg-blue-600 text-sm">
            {statusCounts.NEW} new
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5 text-orange-600" />
                User Feedback
              </CardTitle>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Status
              </span>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                  <TabsTrigger value="NEW">
                    <Circle className="mr-1 h-3 w-3" />
                    New ({statusCounts.NEW})
                  </TabsTrigger>
                  <TabsTrigger value="REVIEWED">
                    <Eye className="mr-1 h-3 w-3" />
                    Reviewed ({statusCounts.REVIEWED})
                  </TabsTrigger>
                  <TabsTrigger value="DONE">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Done ({statusCounts.DONE})
                  </TabsTrigger>
                  <TabsTrigger value="DISMISSED">
                    <XCircle className="mr-1 h-3 w-3" />
                    Dismissed ({statusCounts.DISMISSED})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Type
              </span>
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                <TabsList>
                  <TabsTrigger value="all">
                    All ({categoryCounts.all})
                  </TabsTrigger>
                  <TabsTrigger value="bug">
                    <Bug className="mr-1 h-3.5 w-3.5" />
                    Bugs ({categoryCounts.bug})
                  </TabsTrigger>
                  <TabsTrigger value="feature">
                    <Lightbulb className="mr-1 h-3.5 w-3.5" />
                    Features ({categoryCounts.feature})
                  </TabsTrigger>
                  <TabsTrigger value="general">
                    <MessageCircle className="mr-1 h-3.5 w-3.5" />
                    General ({categoryCounts.general})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFeedback.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="min-w-[300px]">Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.map((item) => {
                  const cat =
                    CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.general;
                  const status = STATUS_CONFIG[item.status];
                  const isUpdating = updatingId === item.id;

                  return (
                    <TableRow
                      key={item.id}
                      className={
                        item.status === "DISMISSED"
                          ? "opacity-50"
                          : item.status === "DONE"
                            ? "opacity-75"
                            : ""
                      }
                    >
                      <TableCell className="text-sm text-zinc-500 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        {item.userName || item.userEmail || (
                          <span className="text-zinc-400 italic">
                            Anonymous
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
                          {item.page}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${cat.color}`}>
                          {cat.icon}
                          {cat.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.message}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer ${status.color}`}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                status.icon
                              )}
                              {status.label}
                              <ChevronDown className="h-3 w-3 opacity-50" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {ALL_STATUSES.map((s) => {
                              const cfg = STATUS_CONFIG[s];
                              return (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => handleStatusChange(item.id, s)}
                                  disabled={s === item.status}
                                  className="gap-2"
                                >
                                  {cfg.icon}
                                  {cfg.label}
                                  {s === item.status && (
                                    <span className="ml-auto text-xs text-zinc-400">
                                      current
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-zinc-400">
              <MessageSquarePlus className="mx-auto mb-3 h-10 w-10" />
              <p>
                {categoryFilter === "all" && statusFilter === "all"
                  ? "No feedback yet."
                  : "No matching feedback."}
              </p>
              {(categoryFilter !== "all" || statusFilter !== "all") && (
                <button
                  className="mt-2 text-sm text-orange-600 hover:underline"
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            Are you sure you want to delete this feedback entry?
          </p>
          {deleteTarget && (
            <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">
              &ldquo;{deleteTarget.message}&rdquo;
            </div>
          )}
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
