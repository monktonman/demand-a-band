import { prisma } from "@/lib/prisma";
import { AdminUsersClient } from "./admin-users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          bandPreferences: true,
          cityPreferences: true,
          pledges: true,
        },
      },
    },
  });

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    onboarded: u.onboarded,
    bandPrefs: u._count.bandPreferences,
    pledges: u._count.pledges,
    createdAt: u.createdAt.toISOString(),
  }));

  return <AdminUsersClient users={serialized} />;
}
