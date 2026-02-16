"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  Loader2,
  Check,
  ArrowLeft,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  smsOptIn: boolean;
  role: string;
  createdAt: string;
  _count: {
    bandPreferences: number;
    genrePreferences: number;
    cityPreferences: number;
    pledges: number;
  };
}

type NotifyMethod = "email" | "sms" | "both";

export default function SettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyMethod, setNotifyMethod] = useState<NotifyMethod>("email");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        const user = data.user;
        setProfile(user);
        setName(user.name || "");
        setPhone(formatPhoneDisplay(user.phone || ""));

        // Derive notification method from current state
        if (user.phone && user.smsOptIn) {
          setNotifyMethod("both");
        } else if (user.phone && !user.smsOptIn) {
          setNotifyMethod("email");
        } else {
          setNotifyMethod("email");
        }
      } catch {
        setError("Failed to load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      loadProfile();
    }
  }, [status]);

  // Format phone for display: +12125551234 → (212) 555-1234
  function formatPhoneDisplay(phone: string): string {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    // Remove country code if present
    const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
    if (local.length === 10) {
      return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
    }
    return phone;
  }

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/[\s\-\(\)\.]/g, "") || null,
          notifyMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await res.json();
      setProfile((prev) => (prev ? { ...prev, ...data.user } : prev));
      setPhone(formatPhoneDisplay(data.user.phone || ""));
      setSaved(true);

      // Update the session so the navbar/user menu reflects name changes
      if (data.user.name !== session?.user?.name) {
        await updateSession({ name: data.user.name });
      }

      // Clear saved indicator after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const hasPhoneNumber = phone.replace(/[\s\-\(\)\.]/g, "").length >= 10;

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-zinc-500">
            Manage your profile and notification preferences
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success Banner */}
      {saved && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Your settings have been saved.
        </div>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your name and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Email — read-only */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="pl-9 bg-zinc-50 text-zinc-500"
              />
            </div>
            <p className="text-xs text-zinc-400">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Mobile Phone{" "}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(410) 555-1234"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-zinc-400">
              Add your phone to receive text alerts about shows you care about.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to hear about new shows and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notification method cards */}
          <div className="grid gap-3">
            {/* Email Only */}
            <button
              type="button"
              onClick={() => setNotifyMethod("email")}
              className={`flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
                notifyMethod === "email"
                  ? "border-orange-500 bg-orange-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  notifyMethod === "email"
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Email Only</p>
                <p className="text-sm text-zinc-500">
                  Get notified about new shows, pledge confirmations, and updates via email.
                </p>
              </div>
              {notifyMethod === "email" && (
                <Check className="ml-auto mt-1 h-5 w-5 shrink-0 text-orange-600" />
              )}
            </button>

            {/* SMS Only */}
            <button
              type="button"
              onClick={() => {
                if (!hasPhoneNumber) {
                  // Focus the phone input
                  document.getElementById("phone")?.focus();
                  return;
                }
                setNotifyMethod("sms");
              }}
              className={`flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
                notifyMethod === "sms"
                  ? "border-orange-500 bg-orange-50"
                  : !hasPhoneNumber
                  ? "border-zinc-100 bg-zinc-50 opacity-60"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  notifyMethod === "sms"
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Text Messages Only</p>
                <p className="text-sm text-zinc-500">
                  Get SMS alerts for new shows and important updates. Standard messaging rates apply.
                </p>
                {!hasPhoneNumber && (
                  <p className="text-xs text-amber-600 mt-1">
                    Add a phone number above to enable text notifications.
                  </p>
                )}
              </div>
              {notifyMethod === "sms" && (
                <Check className="ml-auto mt-1 h-5 w-5 shrink-0 text-orange-600" />
              )}
            </button>

            {/* Both */}
            <button
              type="button"
              onClick={() => {
                if (!hasPhoneNumber) {
                  document.getElementById("phone")?.focus();
                  return;
                }
                setNotifyMethod("both");
              }}
              className={`flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
                notifyMethod === "both"
                  ? "border-orange-500 bg-orange-50"
                  : !hasPhoneNumber
                  ? "border-zinc-100 bg-zinc-50 opacity-60"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  notifyMethod === "both"
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Email + Text Messages</p>
                <p className="text-sm text-zinc-500">
                  Get both email and SMS notifications. Never miss a show announcement.
                </p>
                {!hasPhoneNumber && (
                  <p className="text-xs text-amber-600 mt-1">
                    Add a phone number above to enable text notifications.
                  </p>
                )}
              </div>
              {notifyMethod === "both" && (
                <Check className="ml-auto mt-1 h-5 w-5 shrink-0 text-orange-600" />
              )}
            </button>
          </div>

          <p className="text-xs text-zinc-400">
            You&apos;ll always receive in-app notifications regardless of this setting.
          </p>
        </CardContent>
      </Card>

      {/* Account Info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-zinc-400" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Role</span>
            <span className="font-medium capitalize">
              {profile?.role?.toLowerCase() || "Fan"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Member since</span>
            <span className="font-medium">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Band preferences</span>
            <span className="font-medium">{profile?._count?.bandPreferences || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Total pledges</span>
            <span className="font-medium">{profile?._count?.pledges || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pb-8">
        <Link href="/dashboard">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
