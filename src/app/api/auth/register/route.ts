import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { normalizePhone } from "@/lib/sms";
import { sendEmail } from "@/lib/resend";
import { emailVerificationEmail } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Normalize phone if provided
    const phone = validatedData.phone
      ? normalizePhone(validatedData.phone)
      : null;

    // Create user (emailVerified remains null until they verify)
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        hashedPassword,
        phone,
        smsOptIn: !!phone, // opted in by providing phone number
      },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: validatedData.email,
        token,
        expires,
      },
    });

    // Send verification email
    try {
      const verifyUrl = `${process.env.NEXTAUTH_URL || "https://demanda.band"}/api/auth/verify-email?token=${token}`;
      const emailContent = emailVerificationEmail(validatedData.name || "there", verifyUrl);
      await sendEmail({ to: validatedData.email, ...emailContent });
    } catch (err) {
      console.error("Failed to send verification email:", err);
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid registration data" },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
