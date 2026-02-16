"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export function ViewTicketsButton({ pledgeId }: { pledgeId: string }) {
  return (
    <Link
      href={`/my-events/tickets/${pledgeId}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        size="sm"
        className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs"
      >
        <QrCode className="h-3.5 w-3.5" />
        View Tickets
      </Button>
    </Link>
  );
}
