import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { CheckInScanner } from "./check-in-scanner";

export const dynamic = "force-dynamic";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Only admin/operator can access
  if (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR") {
    redirect("/");
  }

  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      band: { select: { name: true } },
      venue: { select: { name: true, city: true, state: true } },
      _count: { select: { tickets: true } },
    },
  });

  if (!event) {
    notFound();
  }

  const checkedInCount = await prisma.ticket.count({
    where: { eventId, checkedInAt: { not: null } },
  });

  return (
    <CheckInScanner
      eventId={event.id}
      bandName={event.band.name}
      venueName={event.venue.name}
      totalTickets={event._count.tickets}
      initialCheckedIn={checkedInCount}
    />
  );
}
