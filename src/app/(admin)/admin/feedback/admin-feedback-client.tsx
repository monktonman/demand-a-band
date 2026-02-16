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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquarePlus, Trash2, Loader2, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface SerializedFeedback {
  id: string;
  page: string;
  category: string;
  message: string;
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

export function AdminFeedbackClient({
  feedback,
}: {
  feedback: SerializedFeedback[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<SerializedFeedback | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredFeedback = useMemo(() => {
    if (filter === "all") return feedback;
    return feedback.filter((f) => f.category === filter);
  }, [feedback, filter]);

  const counts = useMemo(
    () => ({
      all: feedback.length,
      bug: feedback.filter((f) => f.category === "bug").length,
      feature: feedback.filter((f) => f.category === "feature").length,
      general: feedback.filter((f) => f.category === "general").length,
    }),
    [feedback]
  );

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
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-zinc-500">
          {feedback.length} feedback entries from users
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-orange-600" />
              User Feedback
            </CardTitle>
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                <TabsTrigger value="bug">
                  <Bug className="mr-1 h-3.5 w-3.5" />
                  Bugs ({counts.bug})
                </TabsTrigger>
                <TabsTrigger value="feature">
                  <Lightbulb className="mr-1 h-3.5 w-3.5" />
                  Features ({counts.feature})
                </TabsTrigger>
                <TabsTrigger value="general">
                  <MessageCircle className="mr-1 h-3.5 w-3.5" />
                  General ({counts.general})
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.map((item) => {
                  const cat = CATEGORY_CONFIG[item.category] ||
                    CATEGORY_CONFIG.general;
                  return (
                    <TableRow key={item.id}>
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
                      <TableCell className="text-sm">
                        {item.message}
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
                {filter === "all"
                  ? "No feedback yet."
                  : `No ${filter} feedback yet.`}
              </p>
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
