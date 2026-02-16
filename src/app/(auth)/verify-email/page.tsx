"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  // After successful verification, update the session so middleware knows
  useEffect(() => {
    if (success === "true") {
      update({ emailVerified: true });
    }
  }, [success, update]);

  const handleResend = async () => {
    if (!session?.user?.email) return;

    setIsResending(true);
    setResendError("");
    setResendSuccess(false);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });

      if (!res.ok) {
        throw new Error("Failed to resend");
      }

      setResendSuccess(true);
    } catch {
      setResendError("Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Success state — email verified
  if (success === "true") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been verified successfully. You&apos;re all set!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/onboarding">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Continue to Setup
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  const errorMessages: Record<string, { title: string; description: string }> = {
    "missing-token": {
      title: "Missing Verification Link",
      description: "The verification link appears to be incomplete. Please check your email and try clicking the link again.",
    },
    "invalid-token": {
      title: "Invalid Verification Link",
      description: "This verification link is invalid or has already been used. Request a new one below.",
    },
    "expired-token": {
      title: "Link Expired",
      description: "This verification link has expired. Request a new one below.",
    },
    "server-error": {
      title: "Something Went Wrong",
      description: "We encountered an error verifying your email. Please try again.",
    },
  };

  const errorInfo = error ? errorMessages[error] : null;

  if (errorInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{errorInfo.title}</CardTitle>
            <CardDescription>{errorInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            {session?.user?.email && (
              <Button
                onClick={handleResend}
                disabled={isResending || resendSuccess}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Sent!
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            )}
            {resendSuccess && (
              <p className="text-sm text-green-600">
                A new verification email has been sent to {session?.user?.email}.
              </p>
            )}
            {resendError && (
              <p className="text-sm text-red-600">{resendError}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default state — waiting for verification (shown when redirected here by middleware)
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Mail className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to{" "}
            <strong className="text-zinc-700">{session?.user?.email || "your email"}</strong>.
            Click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-zinc-50 p-4 text-sm text-zinc-600">
            <p className="font-medium text-zinc-700 mb-1">Didn&apos;t get the email?</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-zinc-500">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and try resending below</li>
            </ul>
          </div>

          <Button
            onClick={handleResend}
            disabled={isResending || resendSuccess}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Verification email sent!
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>

          {resendError && (
            <p className="text-sm text-red-600 text-center">{resendError}</p>
          )}

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
