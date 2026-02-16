import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/resend";
import { emailVerificationEmail } from "@/lib/email-templates";

// GET: Verify email with token (called when user clicks the link)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/verify-email?error=missing-token", process.env.NEXTAUTH_URL || "https://demanda.band")
    );
  }

  try {
    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/verify-email?error=invalid-token", process.env.NEXTAUTH_URL || "https://demanda.band")
      );
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.redirect(
        new URL("/verify-email?error=expired-token", process.env.NEXTAUTH_URL || "https://demanda.band")
      );
    }

    // Mark user's email as verified
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/verify-email?success=true", process.env.NEXTAUTH_URL || "https://demanda.band")
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/verify-email?error=server-error", process.env.NEXTAUTH_URL || "https://demanda.band")
    );
  }
}

// POST: Resend verification email
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user) {
      // Don't reveal if user exists — always return success
      return NextResponse.json({ success: true });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Generate new verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL || "https://demanda.band"}/api/auth/verify-email?token=${token}`;
    const emailContent = emailVerificationEmail(user.name || "there", verifyUrl);
    await sendEmail({ to: email, ...emailContent });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
