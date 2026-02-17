import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { sendEmailWithLog, resendClient } from "@/lib/resend";

// GET /api/admin/emails/[id] — Single email log detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const emailLog = await prisma.emailLog.findUnique({
      where: { id },
    });

    if (!emailLog) {
      return NextResponse.json(
        { error: "Email log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ emailLog });
  } catch (error) {
    console.error("[Admin Emails] GET detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email log" },
      { status: 500 }
    );
  }
}

// POST /api/admin/emails/[id] — Resend an email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { overrideTo } = body as { overrideTo?: string };

    // Fetch the original email log
    const emailLog = await prisma.emailLog.findUnique({
      where: { id },
    });

    if (!emailLog) {
      return NextResponse.json(
        { error: "Email log not found" },
        { status: 404 }
      );
    }

    // We need the original HTML from Resend API
    if (!resendClient) {
      return NextResponse.json(
        { error: "Resend client not configured — cannot resend" },
        { status: 503 }
      );
    }

    if (!emailLog.resendId) {
      return NextResponse.json(
        {
          error:
            "Cannot resend — original email data not available from Resend (no resendId)",
        },
        { status: 400 }
      );
    }

    // Fetch original email data from Resend API
    const { data, error: resendError } = await resendClient.emails.get(
      emailLog.resendId
    );

    if (resendError || !data) {
      console.error(
        "[Admin Emails] Failed to fetch from Resend:",
        resendError
      );
      return NextResponse.json(
        {
          error:
            "Cannot resend — original email data not available from Resend",
        },
        { status: 400 }
      );
    }

    const originalHtml = (data as unknown as Record<string, unknown>).html as
      | string
      | undefined;

    if (!originalHtml) {
      return NextResponse.json(
        {
          error:
            "Cannot resend — original email HTML not available from Resend",
        },
        { status: 400 }
      );
    }

    const recipient = overrideTo || emailLog.to;

    const result = await sendEmailWithLog({
      to: recipient,
      subject: emailLog.subject,
      html: originalHtml,
      templateType: "resend",
      sentBy: session.user.email || undefined,
      metadata: { originalEmailLogId: id },
    });

    return NextResponse.json({
      success: true,
      emailId: result?.id || null,
    });
  } catch (error) {
    console.error("[Admin Emails] POST resend error:", error);
    return NextResponse.json(
      { error: "Failed to resend email" },
      { status: 500 }
    );
  }
}
