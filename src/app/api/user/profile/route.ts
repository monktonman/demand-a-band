import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/sms";
import { z } from "zod";

// GET /api/user/profile — get current user's profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      smsOptIn: true,
      role: true,
      onboarded: true,
      createdAt: true,
      _count: {
        select: {
          bandPreferences: true,
          genrePreferences: true,
          cityPreferences: true,
          pledges: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// Validation schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z
    .string()
    .transform((val) => val.replace(/[\s\-\(\)\.]/g, ""))
    .refine((val) => val === "" || /^(\+?1)?[2-9]\d{9}$/.test(val), {
      message: "Enter a valid US phone number",
    })
    .optional()
    .nullable(),
  smsOptIn: z.boolean().optional(),
  emailOptIn: z.boolean().optional(), // Not stored separately yet, but for future use
  notifyMethod: z.enum(["email", "sms", "both"]).optional(),
});

// PATCH /api/user/profile — update profile fields
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    // Build update payload
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.phone !== undefined) {
      // Normalize phone or set to null if empty
      updateData.phone = data.phone ? normalizePhone(data.phone) : null;
    }

    if (data.notifyMethod !== undefined) {
      // Derive smsOptIn from notification preference
      updateData.smsOptIn = data.notifyMethod === "sms" || data.notifyMethod === "both";
    } else if (data.smsOptIn !== undefined) {
      updateData.smsOptIn = data.smsOptIn;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        smsOptIn: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
