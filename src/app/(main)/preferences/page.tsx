import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PreferencesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <Construction className="mx-auto mb-6 h-16 w-16 text-amber-400" />
      <h1 className="text-3xl font-bold">Under Construction</h1>
      <p className="mt-3 text-zinc-500 max-w-md mx-auto">
        The preferences management page is coming soon. For now, you can update your band and city preferences through onboarding.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/onboarding">
          <Button className="bg-orange-600 hover:bg-orange-700">
            Update via Onboarding
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
