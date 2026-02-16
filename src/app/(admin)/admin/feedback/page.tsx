import { prisma } from "@/lib/prisma";
import { AdminFeedbackClient } from "./admin-feedback-client";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  const serialized = feedback.map((f) => ({
    id: f.id,
    page: f.page,
    category: f.category,
    message: f.message,
    status: f.status,
    userName: f.user?.name || null,
    userEmail: f.user?.email || null,
    createdAt: f.createdAt.toISOString(),
  }));

  return <AdminFeedbackClient feedback={serialized} />;
}
