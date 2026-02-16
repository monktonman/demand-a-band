import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

// DELETE: Remove band
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Check for active events with this band
    const activeEvents = await prisma.event.count({
      where: {
        bandId: id,
        status: { in: ["PROPOSED", "THRESHOLD_MET", "CONFIRMED"] },
      },
    });

    if (activeEvents > 0) {
      return NextResponse.json(
        { error: `Cannot delete band with ${activeEvents} active event(s)` },
        { status: 400 }
      );
    }

    // Delete related records then the band
    await prisma.$transaction([
      prisma.userBandPreference.deleteMany({ where: { bandId: id } }),
      prisma.dreamShow.deleteMany({ where: { bandId: id } }),
      prisma.band.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting band:", error);
    return NextResponse.json(
      { error: "Failed to delete band" },
      { status: 500 }
    );
  }
}
