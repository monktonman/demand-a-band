"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Loader2,
  Music,
  MapPin,
  Heart,
  Ticket,
  Star,
  Bell,
  MessageSquare,
  Mail,
  Phone,
  CreditCard,
  CheckCircle,
  XCircle,
  Globe,
  Calendar,
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────

interface BandPreferenceDetail {
  id: string;
  maxTicketPrice: string;
  priority: number;
  isDreamShow: boolean;
  band: {
    id: string;
    name: string;
    slug: string;
    genres: string[];
    imageUrl: string | null;
  };
}

interface CityPreferenceDetail {
  id: string;
  city: string;
  state: string;
  maxRadius: number;
}

interface GenrePreferenceDetail {
  id: string;
  genre: string;
}

interface PledgeDetail {
  id: string;
  quantity: number;
  totalAmount: string;
  status: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    status: string;
    eventDate: string;
    band: { name: string };
    venue: { name: string; city: string; state: string };
  };
}

interface TicketDetail {
  id: string;
  ticketCode: string;
  checkedInAt: string | null;
  createdAt: string;
  event: {
    id: string;
    title: string;
    eventDate: string;
    band: { name: string };
    venue: { name: string };
  };
}

interface DreamShowDetail {
  id: string;
  shareCode: string;
  maxTicketPrice: string;
  priceTierLabel: string;
  venueSize: string | null;
  venueSizeLabel: string | null;
  message: string | null;
  createdAt: string;
  band: { id: string; name: string; imageUrl: string | null };
  venue: { id: string; name: string; city: string; state: string } | null;
  _count: { votes: number };
}

interface NotificationDetail {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface FeedbackDetail {
  id: string;
  page: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
}

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  onboarded: boolean;
  smsOptIn: boolean;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  bandPreferences: BandPreferenceDetail[];
  cityPreferences: CityPreferenceDetail[];
  genrePreferences: GenrePreferenceDetail[];
  pledges: PledgeDetail[];
  tickets: TicketDetail[];
  dreamShows: DreamShowDetail[];
  notifications: NotificationDetail[];
  feedback: FeedbackDetail[];
}

// ─── Constants ───────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-600",
  OPERATOR: "bg-blue-600",
  FAN: "",
};

const PLEDGE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  CHARGED: "bg-green-100 text-green-800",
  PAYMENT_FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-zinc-100 text-zinc-800",
};

const EVENT_STATUS_COLORS: Record<string, string> = {
  PROPOSED: "bg-blue-100 text-blue-800",
  THRESHOLD_MET: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-zinc-100 text-zinc-800",
};

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  EVENT_CREATED: "bg-blue-100 text-blue-800",
  THRESHOLD_MET: "bg-amber-100 text-amber-800",
  EVENT_CONFIRMED: "bg-green-100 text-green-800",
  EVENT_CANCELLED: "bg-red-100 text-red-800",
  PAYMENT_FAILED: "bg-red-100 text-red-800",
  PLEDGE_REMINDER: "bg-orange-100 text-orange-800",
};

const FEEDBACK_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  REVIEWED: "bg-amber-100 text-amber-800",
  DONE: "bg-green-100 text-green-800",
  DISMISSED: "bg-zinc-100 text-zinc-800",
};

const FEEDBACK_CATEGORY_COLORS: Record<string, string> = {
  bug: "bg-red-100 text-red-800",
  feature: "bg-purple-100 text-purple-800",
  general: "bg-zinc-100 text-zinc-800",
};

// ─── Helpers ─────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// ─── Page Component ──────────────────────────────────────────

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch(`/api/admin/users/${id}`);
      const data = await res.json();
      setUser(data.user || null);
      setIsLoading(false);
    };
    loadUser();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">User not found</p>
        <Link href="/admin/users">
          <Button variant="link" className="mt-2">
            Back to users
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {user.name || user.email}
            </h1>
            <Badge
              variant={user.role === "FAN" ? "outline" : "default"}
              className={ROLE_COLORS[user.role] || ""}
            >
              {user.role.toLowerCase()}
            </Badge>
            {user.onboarded ? (
              <Badge className="bg-green-600">Onboarded</Badge>
            ) : (
              <Badge variant="outline">Not onboarded</Badge>
            )}
          </div>
          {user.name && (
            <p className="text-zinc-500">{user.email}</p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-zinc-400" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-zinc-400" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-zinc-400" />
              <span>
                {user.stripeCustomerId
                  ? `Stripe: ${user.stripeCustomerId}`
                  : "No Stripe account"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-zinc-400" />
              <span>SMS opt-in: {user.smsOptIn ? "Yes" : "No"}</span>
            </div>
            <Separator />
            <div className="text-sm text-zinc-500">
              <p>Joined: {formatDate(user.createdAt)}</p>
              <p>Last updated: {formatDate(user.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-orange-600" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-600">
                  {user.bandPreferences.length}
                </span>
                <p className="text-xs text-zinc-500">Bands</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-600">
                  {user.genrePreferences.length}
                </span>
                <p className="text-xs text-zinc-500">Genres</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-600">
                  {user.cityPreferences.length}
                </span>
                <p className="text-xs text-zinc-500">Locations</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-600">
                  {user.pledges.length}
                </span>
                <p className="text-xs text-zinc-500">Pledges</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-600">
                  {user.tickets.length}
                </span>
                <p className="text-xs text-zinc-500">Tickets</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-600">
                  {user.dreamShows.length}
                </span>
                <p className="text-xs text-zinc-500">Dream Shows</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Detail Sections */}
      <Tabs defaultValue="bands">
        <TabsList className="flex-wrap">
          <TabsTrigger value="bands">
            <Music className="h-3.5 w-3.5" />
            Bands ({user.bandPreferences.length})
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin className="h-3.5 w-3.5" />
            Locations ({user.cityPreferences.length})
          </TabsTrigger>
          <TabsTrigger value="genres">
            <Globe className="h-3.5 w-3.5" />
            Genres ({user.genrePreferences.length})
          </TabsTrigger>
          <TabsTrigger value="pledges">
            <Ticket className="h-3.5 w-3.5" />
            Pledges ({user.pledges.length})
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-3.5 w-3.5" />
            Tickets ({user.tickets.length})
          </TabsTrigger>
          <TabsTrigger value="dreamshows">
            <Star className="h-3.5 w-3.5" />
            Dream Shows ({user.dreamShows.length})
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-3.5 w-3.5" />
            Notifications ({user.notifications.length})
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <MessageSquare className="h-3.5 w-3.5" />
            Feedback ({user.feedback.length})
          </TabsTrigger>
        </TabsList>

        {/* Band Preferences */}
        <TabsContent value="bands">
          <Card>
            <CardContent className="pt-6">
              {user.bandPreferences.length === 0 ? (
                <EmptyState icon={Music} label="No band preferences" />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Band</TableHead>
                        <TableHead>Genres</TableHead>
                        <TableHead className="text-right">Max Price</TableHead>
                        <TableHead className="text-center">Priority</TableHead>
                        <TableHead className="text-center">Dream Show</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.bandPreferences.map((bp) => (
                        <TableRow key={bp.id}>
                          <TableCell className="font-medium">
                            {bp.band.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {bp.band.genres.slice(0, 3).map((g) => (
                                <Badge
                                  key={g}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {g}
                                </Badge>
                              ))}
                              {bp.band.genres.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{bp.band.genres.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ${Number(bp.maxTicketPrice).toFixed(0)}
                          </TableCell>
                          <TableCell className="text-center">
                            {bp.priority}
                          </TableCell>
                          <TableCell className="text-center">
                            {bp.isDreamShow ? (
                              <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="mx-auto h-4 w-4 text-zinc-300" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations */}
        <TabsContent value="locations">
          <Card>
            <CardContent className="pt-6">
              {user.cityPreferences.length === 0 ? (
                <EmptyState icon={MapPin} label="No location preferences" />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead className="text-right">
                          Max Radius
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.cityPreferences.map((cp) => (
                        <TableRow key={cp.id}>
                          <TableCell className="font-medium">
                            {cp.city}
                          </TableCell>
                          <TableCell>{cp.state}</TableCell>
                          <TableCell className="text-right">
                            {cp.maxRadius} mi
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Genres */}
        <TabsContent value="genres">
          <Card>
            <CardContent className="pt-6">
              {user.genrePreferences.length === 0 ? (
                <EmptyState icon={Globe} label="No genre preferences" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.genrePreferences.map((gp) => (
                    <Badge key={gp.id} variant="outline" className="text-sm">
                      {gp.genre}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pledges */}
        <TabsContent value="pledges">
          <Card>
            <CardContent className="pt-6">
              {user.pledges.length === 0 ? (
                <EmptyState icon={Ticket} label="No pledges" />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Band</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.pledges.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/admin/events/${p.event.id}`}
                              className="text-orange-600 hover:underline"
                            >
                              {p.event.title}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.event.band.name}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500">
                            {p.event.venue.name}, {p.event.venue.city}
                          </TableCell>
                          <TableCell className="text-center">
                            {p.quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${Number(p.totalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                PLEDGE_STATUS_COLORS[p.status] ||
                                "bg-zinc-100 text-zinc-800"
                              }
                            >
                              {p.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500">
                            {formatDate(p.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets */}
        <TabsContent value="tickets">
          <Card>
            <CardContent className="pt-6">
              {user.tickets.length === 0 ? (
                <EmptyState icon={Ticket} label="No tickets" />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Band</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Ticket Code</TableHead>
                        <TableHead>Checked In</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.tickets.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/admin/events/${t.event.id}`}
                              className="text-orange-600 hover:underline"
                            >
                              {t.event.title}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm">
                            {t.event.band.name}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500">
                            {t.event.venue.name}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded">
                              {t.ticketCode}
                            </code>
                          </TableCell>
                          <TableCell>
                            {t.checkedInAt ? (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-green-700">
                                  {formatDateTime(t.checkedInAt)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400">
                                Not checked in
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500">
                            {formatDate(t.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dream Shows */}
        <TabsContent value="dreamshows">
          <Card>
            <CardContent className="pt-6">
              {user.dreamShows.length === 0 ? (
                <EmptyState icon={Star} label="No dream shows" />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Band</TableHead>
                        <TableHead>Venue / Size</TableHead>
                        <TableHead>Price Tier</TableHead>
                        <TableHead className="text-center">Votes</TableHead>
                        <TableHead>Share Code</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.dreamShows.map((ds) => (
                        <TableRow key={ds.id}>
                          <TableCell className="font-medium">
                            {ds.band.name}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500">
                            {ds.venue
                              ? `${ds.venue.name}, ${ds.venue.city}`
                              : ds.venueSizeLabel || ds.venueSize || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {ds.priceTierLabel}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {ds._count.votes}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded">
                              {ds.shareCode}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500">
                            {formatDate(ds.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardContent className="pt-6">
              {user.notifications.length === 0 ? (
                <EmptyState icon={Bell} label="No notifications" />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-[300px]">Message</TableHead>
                        <TableHead className="text-center">Read</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.notifications.map((n) => (
                        <TableRow
                          key={n.id}
                          className={n.isRead ? "opacity-60" : ""}
                        >
                          <TableCell>
                            <Badge
                              className={
                                NOTIFICATION_TYPE_COLORS[n.type] ||
                                "bg-zinc-100 text-zinc-800"
                              }
                            >
                              {n.type.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {n.title}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500 max-w-[300px] truncate">
                            {n.message}
                          </TableCell>
                          <TableCell className="text-center">
                            {n.isRead ? (
                              <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="mx-auto h-4 w-4 text-zinc-300" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500">
                            {formatDate(n.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback">
          <Card>
            <CardContent className="pt-6">
              {user.feedback.length === 0 ? (
                <EmptyState icon={MessageSquare} label="No feedback" />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Page</TableHead>
                        <TableHead className="w-[300px]">Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.feedback.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>
                            <Badge
                              className={
                                FEEDBACK_CATEGORY_COLORS[f.category] ||
                                "bg-zinc-100 text-zinc-800"
                              }
                            >
                              {f.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded">
                              {f.page}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate">
                            {f.message}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                FEEDBACK_STATUS_COLORS[f.status] ||
                                "bg-zinc-100 text-zinc-800"
                              }
                            >
                              {f.status.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500">
                            {formatDate(f.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Empty State Component ───────────────────────────────────

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="py-12 text-center text-zinc-400">
      <Icon className="mx-auto h-8 w-8 mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
