import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  Music2,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { TicketQrCode } from "./ticket-qr-code";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ pledgeId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { pledgeId } = await params;

  const pledge = await prisma.pledge.findUnique({
    where: { id: pledgeId },
    include: {
      event: {
        include: {
          band: true,
          venue: true,
        },
      },
      tickets: {
        orderBy: { createdAt: "asc" },
      },
      user: { select: { id: true, name: true } },
    },
  });

  // Verify ownership
  if (!pledge || pledge.userId !== session.user.id) {
    notFound();
  }

  if (pledge.tickets.length === 0) {
    notFound();
  }

  const event = pledge.event;
  const checkedInCount = pledge.tickets.filter((t) => t.checkedInAt).length;
  const isEventPast = new Date(event.eventDate) < new Date();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <Link
        href="/my-events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Events
      </Link>

      {/* Event header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
            <Music2 className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{event.band.name}</h1>
            <p className="text-zinc-500">at {event.venue.name}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-zinc-400" />
            {formatDate(event.eventDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-zinc-400" />
            {event.venue.city}, {event.venue.state}
          </span>
          {event.doorsTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-zinc-400" />
              Doors: {formatTime(event.doorsTime)}
            </span>
          )}
          {event.showTime && (
            <span className="flex items-center gap-1.5">
              <Music2 className="h-4 w-4 text-zinc-400" />
              Show: {formatTime(event.showTime)}
            </span>
          )}
        </div>

        {/* Summary bar */}
        <div className="mt-4 flex items-center gap-3">
          <Badge className="bg-green-600 text-white">
            <Ticket className="mr-1 h-3 w-3" />
            {pledge.tickets.length} Ticket{pledge.tickets.length > 1 ? "s" : ""}
          </Badge>
          {checkedInCount > 0 && (
            <Badge variant="outline" className="text-green-700 border-green-300">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {checkedInCount} Checked In
            </Badge>
          )}
          {isEventPast && (
            <Badge variant="outline" className="text-zinc-500">
              Past Show
            </Badge>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!isEventPast && (
        <div className="mb-6 rounded-xl bg-orange-50 border border-orange-200 p-4">
          <p className="text-sm font-medium text-orange-800">
            Show {pledge.tickets.length > 1 ? "each" : "this"} QR code at the door for entry
          </p>
          <p className="mt-1 text-xs text-orange-600">
            Each ticket has a unique code. Screenshots work too!
          </p>
        </div>
      )}

      {/* Ticket cards */}
      <div className="space-y-6">
        {pledge.tickets.map((ticket, index) => (
          <Card
            key={ticket.id}
            className={`overflow-hidden ${
              ticket.checkedInAt
                ? "border-green-200 bg-green-50/30"
                : "border-orange-200"
            }`}
          >
            <CardContent className="p-0">
              {/* Ticket header strip */}
              <div
                className={`px-5 py-3 flex items-center justify-between ${
                  ticket.checkedInAt
                    ? "bg-green-100"
                    : "bg-gradient-to-r from-orange-500 to-amber-500"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    ticket.checkedInAt ? "text-green-800" : "text-white"
                  }`}
                >
                  {pledge.tickets.length > 1
                    ? `Ticket ${index + 1} of ${pledge.tickets.length}`
                    : "Your Ticket"}
                </span>
                {ticket.checkedInAt ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Checked In
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-white/80">
                    <CircleDashed className="h-3.5 w-3.5" />
                    Not Yet Scanned
                  </span>
                )}
              </div>

              {/* QR Code section */}
              <div className="flex flex-col items-center py-8 px-5">
                <TicketQrCode ticketCode={ticket.ticketCode} />

                {/* Ticket code */}
                <p className="mt-4 font-mono text-xl font-bold tracking-widest text-zinc-900">
                  {ticket.ticketCode}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {pledge.user.name || "Fan"} &middot; {event.band.name}
                </p>
              </div>

              {/* Dashed divider */}
              <div className="relative px-5">
                <div className="border-t-2 border-dashed border-zinc-200" />
                <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-white" />
                <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-white" />
              </div>

              {/* Footer */}
              <div className="px-5 py-4 text-center">
                <p className="text-xs text-zinc-400">
                  Demand A Band &middot; {event.venue.name} &middot;{" "}
                  {formatDate(event.eventDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="mt-8 flex justify-center">
        <Link href="/my-events">
          <Button variant="outline" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to My Events
          </Button>
        </Link>
      </div>
    </div>
  );
}
