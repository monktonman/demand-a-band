import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { syncEmailStatus } from "@/lib/resend";

// POST /api/admin/emails/[id]/sync — Refresh delivery status from Resend API
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const newStatus = await syncEmailStatus(id);

    if (!newStatus) {
      return NextResponse.json(
        {
          error:
            "Failed to sync status — email log not found, no resendId, or Resend API unavailable",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
    });
  } catch (error) {
    console.error("[Admin Emails] Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync email status" },
      { status: 500 }
    );
  }
}
