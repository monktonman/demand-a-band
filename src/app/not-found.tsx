import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
          <Music className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900">Page Not Found</h2>
        <p className="mt-2 text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
          <Link href="/events">
            <Button className="bg-orange-600 hover:bg-orange-700">
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
