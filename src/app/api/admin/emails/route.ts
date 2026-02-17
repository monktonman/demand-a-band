import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { sendEmailWithLog } from "@/lib/resend";
import { EmailStatus, Prisma } from "@prisma/client";

// GET /api/admin/emails — Paginated email log list
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const templateType = searchParams.get("templateType");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  // Build Prisma where clause
  const where: Prisma.EmailLogWhereInput = {};

  if (status) {
    where.status = status as EmailStatus;
  }

  if (templateType) {
    where.templateType = templateType;
  }

  if (search) {
    where.OR = [
      { to: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [emails, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.emailLog.count({ where }),
    ]);

    return NextResponse.json({
      emails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[Admin Emails] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email logs" },
      { status: 500 }
    );
  }
}

// POST /api/admin/emails — Manual send
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { to, subject, html } = body;

    if (!to || typeof to !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'to' field" },
        { status: 400 }
      );
    }

    // Resolve "me" to the admin's own email
    const recipient = to === "me" ? (session.user.email || "") : to;
    if (!recipient) {
      return NextResponse.json(
        { error: "Could not resolve recipient email" },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'subject' field" },
        { status: 400 }
      );
    }

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'html' field" },
        { status: 400 }
      );
    }

    const result = await sendEmailWithLog({
      to: recipient,
      subject,
      html,
      templateType: "manual",
      sentBy: session.user.email || undefined,
      metadata: { html },
    });

    return NextResponse.json({
      success: true,
      emailId: result?.id || null,
    });
  } catch (error) {
    console.error("[Admin Emails] POST error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
