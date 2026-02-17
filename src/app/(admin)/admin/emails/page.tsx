import { prisma } from "@/lib/prisma";
import { EmailsClient } from "./emails-client";
import { GENRES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  // Fetch initial data for the page
  const [recentEmails, statusCounts, bands] = await Promise.all([
    // Recent emails for the dashboard tab
    prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),

    // Status counts for filter badges
    prisma.$transaction([
      prisma.emailLog.count(),
      prisma.emailLog.count({ where: { status: "SENT" } }),
      prisma.emailLog.count({ where: { status: "DELIVERED" } }),
      prisma.emailLog.count({ where: { status: "BOUNCED" } }),
      prisma.emailLog.count({ where: { status: "FAILED" } }),
      prisma.emailLog.count({ where: { status: "COMPLAINED" } }),
    ]),

    // Bands for broadcast segment selector
    prisma.band.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedEmails = recentEmails.map((e) => ({
    id: e.id,
    resendId: e.resendId,
    to: e.to,
    subject: e.subject,
    templateType: e.templateType,
    status: e.status,
    userId: e.userId,
    eventId: e.eventId,
    metadata: e.metadata,
    sentBy: e.sentBy,
    errorMessage: e.errorMessage,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  const counts = {
    all: statusCounts[0],
    sent: statusCounts[1],
    delivered: statusCounts[2],
    bounced: statusCounts[3],
    failed: statusCounts[4],
    complained: statusCounts[5],
  };

  return (
    <EmailsClient
      initialEmails={serializedEmails}
      statusCounts={counts}
      bands={bands}
      genres={[...GENRES]}
    />
  );
}
