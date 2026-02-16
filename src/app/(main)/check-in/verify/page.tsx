import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ticket, Music2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function VerifyTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { code } = await searchParams;

  if (!code) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <Ticket className="mx-auto mb-3 h-10 w-10 text-zinc-400" />
            <h1 className="text-lg font-bold">No Ticket Code</h1>
            <p className="mt-2 text-sm text-zinc-500">
              This link is missing a ticket code. Please use the QR code from
              your ticket email.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Look up the ticket
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode: code.toUpperCase().trim() },
    include: {
      event: {
        include: {
          band: { select: { name: true } },
          venue: { select: { name: true, city: true, state: true } },
        },
      },
      user: { select: { id: true, name: true } },
    },
  });

  if (!ticket) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Card className="max-w-md border-red-200">
          <CardContent className="py-8 text-center">
            <Ticket className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <h1 className="text-lg font-bold text-red-800">Invalid Ticket</h1>
            <p className="mt-2 text-sm text-zinc-500">
              This ticket code was not found. Please check your email for valid
              tickets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If the user is staff (ADMIN/OPERATOR), redirect to scanner page
  if (
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "OPERATOR"
  ) {
    redirect(`/check-in/${ticket.eventId}`);
  }

  // For fans: show ticket info
  const isOwner = session?.user?.id === ticket.userId;

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
      <Card className="max-w-md w-full">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
              <Music2 className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-xl font-bold">{ticket.event.band.name}</h1>
            <p className="text-sm text-zinc-500">
              at {ticket.event.venue.name}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {formatDate(ticket.event.eventDate)}
            </p>

            <div className="mt-4">
              <p className="font-mono text-lg font-bold tracking-wider">
                {ticket.ticketCode}
              </p>
              <p className="text-xs text-zinc-400">
                {ticket.user.name || "Fan"}
              </p>
            </div>

            <div className="mt-4">
              {ticket.checkedInAt ? (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Checked In
                </Badge>
              ) : (
                <Badge className="bg-orange-600 text-white">
                  <Ticket className="mr-1 h-3 w-3" />
                  Valid Ticket
                </Badge>
              )}
            </div>

            {isOwner && (
              <Link href={`/my-events/tickets/${ticket.pledgeId}`}>
                <Button className="mt-6 bg-orange-600 hover:bg-orange-700">
                  View All My Tickets
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
