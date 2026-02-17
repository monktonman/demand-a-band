"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Mail,
  Send,
  RefreshCw,
  Loader2,
  Search,
  Eye,
  RotateCw,
  Megaphone,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { EmailStatus } from "@prisma/client";

// ------------------------------------
// Types
// ------------------------------------

interface SerializedEmail {
  id: string;
  resendId: string | null;
  to: string;
  subject: string;
  templateType: string | null;
  status: EmailStatus;
  userId: string | null;
  eventId: string | null;
  metadata: string | null;
  sentBy: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StatusCounts {
  all: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  complained: number;
}

interface TemplateInfo {
  type: string;
  label: string;
}

interface Props {
  initialEmails: SerializedEmail[];
  statusCounts: StatusCounts;
  bands: { id: string; name: string }[];
  genres: string[];
}

// ------------------------------------
// Status styling
// ------------------------------------

const STATUS_CONFIG: Record<
  EmailStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  QUEUED: {
    label: "Queued",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-zinc-100 text-zinc-700",
  },
  SENT: {
    label: "Sent",
    icon: <Send className="h-3 w-3" />,
    className: "bg-blue-100 text-blue-700",
  },
  DELIVERED: {
    label: "Delivered",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-green-100 text-green-700",
  },
  BOUNCED: {
    label: "Bounced",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-red-100 text-red-700",
  },
  COMPLAINED: {
    label: "Complained",
    icon: <AlertTriangle className="h-3 w-3" />,
    className: "bg-amber-100 text-amber-700",
  },
  FAILED: {
    label: "Failed",
    icon: <Ban className="h-3 w-3" />,
    className: "bg-red-100 text-red-800",
  },
};

const TEMPLATE_LABELS: Record<string, string> = {
  emailVerification: "Email Verification",
  welcome: "Welcome",
  pledgeConfirmation: "Pledge Confirmation",
  eventConfirmed: "Event Confirmed",
  eventCancelled: "Event Cancelled",
  thresholdMet: "Threshold Met",
  newEventMatch: "New Event Match",
  ticket: "Ticket",
  paymentFailed: "Payment Failed",
  manual: "Manual",
  resend: "Resend",
  broadcast: "Broadcast",
  testEmail: "Test Email",
  unknown: "Unknown",
};

function formatTemplateType(type: string | null): string {
  if (!type) return "—";
  return TEMPLATE_LABELS[type] || type;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ============================================================
// Main Component
// ============================================================

export function EmailsClient({ initialEmails, statusCounts, bands, genres }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Emails</h1>
          <p className="text-sm text-muted-foreground">
            Monitor delivery, send emails, preview templates, and broadcast to segments.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <Mail className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Broadcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab
            initialEmails={initialEmails}
            statusCounts={statusCounts}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="broadcast">
          <BroadcastTab bands={bands} genres={genres} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Dashboard Tab
// ============================================================

function DashboardTab({
  initialEmails,
  statusCounts,
  onRefresh,
}: {
  initialEmails: SerializedEmail[];
  statusCounts: StatusCounts;
  onRefresh: () => void;
}) {
  const [emails, setEmails] = useState(initialEmails);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<SerializedEmail | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Fetch emails with filters
  async function fetchEmails(newPage = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(newPage), limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/emails?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEmails(data.emails);
      setPage(data.page);
    } catch {
      toast.error("Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  }

  // Sync a single email's status
  async function handleSync(emailId: string) {
    setSyncingId(emailId);
    try {
      const res = await fetch(`/api/admin/emails/${emailId}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");

      // Update the email in local state
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, status: data.status } : e))
      );
      toast.success(`Status updated to ${data.status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingId(null);
    }
  }

  // Filter statuses for tabs
  const statusTabs = [
    { key: "all", label: "All", count: statusCounts.all },
    { key: "SENT", label: "Sent", count: statusCounts.sent },
    { key: "DELIVERED", label: "Delivered", count: statusCounts.delivered },
    { key: "BOUNCED", label: "Bounced", count: statusCounts.bounced },
    { key: "FAILED", label: "Failed", count: statusCounts.failed },
  ];

  return (
    <div className="space-y-4">
      {/* Status filter tabs + actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {statusTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
                // Re-fetch
                setTimeout(() => fetchEmails(1), 0);
              }}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSendDialogOpen(true)}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Send Email
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipient or subject…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchEmails(1);
            }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchEmails(1)}>
          Search
        </Button>
      </div>

      {/* Email table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No emails found
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => {
                  const statusInfo = STATUS_CONFIG[email.status];
                  return (
                    <TableRow key={email.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(email.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm font-medium">
                        {email.to}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm">
                        {email.subject}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTemplateType(email.templateType)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`gap-1 ${statusInfo.className}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSync(email.id)}
                            disabled={syncingId === email.id || !email.resendId}
                            title="Refresh status"
                          >
                            {syncingId === email.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEmail(email);
                              setResendDialogOpen(true);
                            }}
                            title="Resend"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {emails.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {emails.length} emails (page {page})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEmails(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEmails(page + 1)}
              disabled={emails.length < 50}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onSent={() => {
          fetchEmails(1);
          onRefresh();
        }}
      />

      {/* Resend Dialog */}
      <ResendDialog
        open={resendDialogOpen}
        onOpenChange={setResendDialogOpen}
        email={selectedEmail}
        onResent={() => {
          fetchEmails(1);
          onRefresh();
        }}
      />
    </div>
  );
}

// ============================================================
// Send Email Dialog
// ============================================================

function SendEmailDialog({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!to || !subject || !html) {
      toast.error("All fields are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");

      toast.success(`Email sent to ${to}`);
      setTo("");
      setSubject("");
      setHtml("");
      onOpenChange(false);
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Compose and send an email manually. It will be logged in the dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">To</label>
            <Input
              placeholder="user@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Subject</label>
            <Input
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Body (HTML)</label>
            <Textarea
              placeholder="<p>Your email content...</p>"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="min-h-[120px] font-mono text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Resend Dialog
// ============================================================

function ResendDialog({
  open,
  onOpenChange,
  email,
  onResent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: SerializedEmail | null;
  onResent: () => void;
}) {
  const [overrideTo, setOverrideTo] = useState("");
  const [sending, setSending] = useState(false);

  async function handleResend() {
    if (!email) return;
    setSending(true);
    try {
      const body: Record<string, string> = {};
      if (overrideTo) body.overrideTo = overrideTo;

      const res = await fetch(`/api/admin/emails/${email.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");

      toast.success(`Email resent to ${overrideTo || email.to}`);
      setOverrideTo("");
      onOpenChange(false);
      onResent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setSending(false);
    }
  }

  if (!email) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resend Email</DialogTitle>
          <DialogDescription>
            Resend this email to the original recipient or override the address.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">{email.subject}</p>
            <p className="text-muted-foreground">
              Originally sent to {email.to} on {formatDate(email.createdAt)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">
              Override recipient <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              placeholder={email.to}
              value={overrideTo}
              onChange={(e) => setOverrideTo(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleResend} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="mr-1.5 h-4 w-4" />
            )}
            Resend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Templates Tab
// ============================================================

function TemplatesTab() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [sendTestLoading, setSendTestLoading] = useState<string | null>(null);

  // Fetch template list on mount
  useEffect(() => {
    fetch("/api/admin/emails/preview")
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data.templates || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handlePreview(templateType: string) {
    setPreviewLoading(templateType);
    try {
      const res = await fetch("/api/admin/emails/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");

      setPreviewSubject(data.subject);
      setPreviewHtml(data.html);
      setPreviewOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewLoading(null);
    }
  }

  async function handleSendTest(templateType: string) {
    setSendTestLoading(templateType);
    try {
      // First get the template preview
      const previewRes = await fetch("/api/admin/emails/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType }),
      });
      const previewData = await previewRes.json();
      if (!previewRes.ok) throw new Error(previewData.error || "Preview failed");

      // Send to the current admin
      const sendRes = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "me", // Will be resolved to admin's email on the server
          subject: `[TEST] ${previewData.subject}`,
          html: previewData.html,
        }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error || "Send failed");

      toast.success("Test email sent to your inbox");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send test failed");
    } finally {
      setSendTestLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Preview how email templates look with sample data, or send a test to your inbox.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{template.label}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">{template.type}</p>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreview(template.type)}
                disabled={previewLoading === template.type}
              >
                {previewLoading === template.type ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                )}
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendTest(template.type)}
                disabled={sendTestLoading === template.type}
              >
                {sendTestLoading === template.type ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                Send Test
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>{previewSubject}</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto rounded-lg border bg-white">
            <iframe
              srcDoc={previewHtml}
              className="h-[500px] w-full border-0"
              title="Email preview"
              sandbox=""
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Broadcast Tab
// ============================================================

function BroadcastTab({
  bands,
  genres,
}: {
  bands: { id: string; name: string }[];
  genres: string[];
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Audience
  const [segmentType, setSegmentType] = useState<string>("");
  const [segmentValue, setSegmentValue] = useState<string>("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Step 2: Compose
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [broadcastPreviewOpen, setBroadcastPreviewOpen] = useState(false);

  // Step 3: Send
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  async function fetchRecipientCount() {
    if (!segmentType) return;
    if (segmentType !== "all" && !segmentValue) {
      toast.error("Please select a value for the segment");
      return;
    }
    setLoadingCount(true);
    try {
      const params = new URLSearchParams({ type: segmentType });
      if (segmentValue) params.set("value", segmentValue);

      const res = await fetch(`/api/admin/emails/segments?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      setRecipientCount(data.recipientCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch recipients");
    } finally {
      setLoadingCount(false);
    }
  }

  async function handleSend(confirmed: boolean) {
    setSending(true);
    try {
      const res = await fetch("/api/admin/emails/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentType,
          segmentValue: segmentType === "all" ? undefined : segmentValue,
          subject,
          html,
          confirmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Broadcast failed");

      if (data.dryRun) {
        setRecipientCount(data.recipientCount);
        toast.info(`Dry run: would send to ${data.recipientCount} recipients`);
      } else {
        setSendResult({ sent: data.sent, failed: data.failed, total: data.total });
        toast.success(`Broadcast sent to ${data.sent} recipients`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed");
    } finally {
      setSending(false);
    }
  }

  function segmentLabel(): string {
    if (segmentType === "genre") return `Fans of ${segmentValue}`;
    if (segmentType === "band") {
      const band = bands.find((b) => b.id === segmentValue);
      return band ? `Fans of ${band.name}` : "Band fans";
    }
    if (segmentType === "event") return `Event pledgers`;
    if (segmentType === "all") return "All fans";
    return "";
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                step === s
                  ? "bg-orange-600 text-white"
                  : step > s
                  ? "bg-green-100 text-green-700"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            <span className={step === s ? "font-medium" : "text-muted-foreground"}>
              {s === 1 ? "Audience" : s === 2 ? "Compose" : "Review & Send"}
            </span>
            {s < 3 && <div className="mx-2 h-px w-8 bg-zinc-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Audience */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { value: "genre", label: "By Genre" },
                { value: "band", label: "By Band" },
                { value: "event", label: "By Event" },
                { value: "all", label: "All Fans" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={segmentType === opt.value ? "default" : "outline"}
                  onClick={() => {
                    setSegmentType(opt.value);
                    setSegmentValue("");
                    setRecipientCount(null);
                  }}
                  className="w-full"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Value selector */}
            {segmentType === "genre" && (
              <Select value={segmentValue} onValueChange={setSegmentValue}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {segmentType === "band" && (
              <Select value={segmentValue} onValueChange={setSegmentValue}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a band" />
                </SelectTrigger>
                <SelectContent>
                  {bands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {segmentType === "event" && (
              <Input
                placeholder="Enter event ID"
                value={segmentValue}
                onChange={(e) => setSegmentValue(e.target.value)}
              />
            )}

            <div className="flex items-center gap-4">
              <Button
                onClick={fetchRecipientCount}
                disabled={
                  loadingCount ||
                  !segmentType ||
                  (segmentType !== "all" && !segmentValue)
                }
              >
                {loadingCount && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Count Recipients
              </Button>

              {recipientCount !== null && (
                <p className="text-sm">
                  <span className="font-semibold text-orange-600">{recipientCount}</span>{" "}
                  recipients
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={recipientCount === null || recipientCount === 0}
              >
                Next: Compose
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Compose */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Your broadcast subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Body (HTML)</label>
              <Textarea
                placeholder="<p>Your broadcast message...</p>"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="min-h-[200px] font-mono text-xs"
              />
            </div>

            {html && (
              <Button
                variant="outline"
                onClick={() => setBroadcastPreviewOpen(true)}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                Preview
              </Button>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!subject || !html}
              >
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Send */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Send</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sendResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Broadcast Complete</span>
                </div>
                <div className="rounded-lg border p-4 text-sm space-y-1">
                  <p>
                    <strong>Sent:</strong> {sendResult.sent}
                  </p>
                  <p>
                    <strong>Failed:</strong> {sendResult.failed}
                  </p>
                  <p>
                    <strong>Total:</strong> {sendResult.total}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setStep(1);
                    setSegmentType("");
                    setSegmentValue("");
                    setRecipientCount(null);
                    setSubject("");
                    setHtml("");
                    setSendResult(null);
                  }}
                >
                  Start New Broadcast
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-lg border p-4 text-sm space-y-2">
                  <p>
                    <strong>Audience:</strong> {segmentLabel()}
                  </p>
                  <p>
                    <strong>Recipients:</strong>{" "}
                    <span className="font-semibold text-orange-600">
                      {recipientCount}
                    </span>
                  </p>
                  <p>
                    <strong>Subject:</strong> {subject}
                  </p>
                </div>

                {recipientCount !== null && recipientCount > 50 && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>
                      Sending to {recipientCount} recipients. This may approach Resend&apos;s daily
                      limit. Emails will be sent in batches of 10 with 1-second delays.
                    </p>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSend(false)}
                      disabled={sending}
                    >
                      Dry Run
                    </Button>
                    <Button
                      onClick={() => handleSend(true)}
                      disabled={sending}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {sending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Megaphone className="mr-1.5 h-4 w-4" />
                      )}
                      Send to {recipientCount} Recipients
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Broadcast Preview Dialog */}
      <Dialog open={broadcastPreviewOpen} onOpenChange={setBroadcastPreviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Broadcast Preview</DialogTitle>
            <DialogDescription>{subject}</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto rounded-lg border bg-white">
            <iframe
              srcDoc={html}
              className="h-[500px] w-full border-0"
              title="Broadcast preview"
              sandbox=""
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
