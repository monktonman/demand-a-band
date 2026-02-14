import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <Construction className="mx-auto mb-6 h-16 w-16 text-amber-400" />
      <h1 className="text-3xl font-bold">Under Construction</h1>
      <p className="mt-3 text-zinc-500 max-w-md mx-auto">
        Account settings are coming soon. You&apos;ll be able to manage your profile, notification preferences, and payment methods here.
      </p>
      <div className="mt-8">
        <Link href="/dashboard">
          <Button variant="outline">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
