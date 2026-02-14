"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Ticket, Loader2, CheckCircle, AlertCircle, LogIn } from "lucide-react";
import { formatCurrencyDecimal } from "@/lib/utils";
import Link from "next/link";

interface PledgeButtonProps {
  eventId: string;
  ticketPrice: number;
  serviceFee: number;
  maxCapacity: number;
  currentPledges: number;
  isAcceptingPledges: boolean;
  userHasPledged: boolean;
}

export function PledgeButton({
  eventId,
  ticketPrice,
  serviceFee,
  maxCapacity,
  currentPledges,
  isAcceptingPledges,
  userHasPledged,
}: PledgeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const totalPerTicket = ticketPrice + serviceFee;
  const totalAmount = totalPerTicket * quantity;
  const remainingCapacity = maxCapacity - currentPledges;
  const maxQuantity = Math.min(remainingCapacity, 10); // Max 10 tickets per pledge

  if (!session?.user) {
    return (
      <Link href="/login?callbackUrl=/events">
        <Button
          className="w-full bg-orange-600 text-base hover:bg-orange-700"
          size="lg"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign in to Pledge
        </Button>
      </Link>
    );
  }

  if (userHasPledged) {
    return (
      <Button
        className="w-full bg-green-600 text-base"
        size="lg"
        disabled
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        You&apos;ve Pledged!
      </Button>
    );
  }

  if (!isAcceptingPledges) {
    return (
      <Button
        className="w-full text-base"
        size="lg"
        disabled
        variant="outline"
      >
        Not Accepting Pledges
      </Button>
    );
  }

  const handlePledge = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          quantity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create pledge");
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-orange-600 text-base hover:bg-orange-700"
          size="lg"
        >
          <Ticket className="mr-2 h-4 w-4" />
          Pledge {formatCurrencyDecimal(totalPerTicket)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold">Pledge Confirmed!</h3>
            <p className="mt-2 text-sm text-zinc-500">
              You&apos;ll only be charged if the show is confirmed.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Your Pledge</DialogTitle>
              <DialogDescription>
                You won&apos;t be charged until the show reaches its minimum
                pledges and is confirmed.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Number of Tickets</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(1, Math.min(maxQuantity, Number(e.target.value)))
                    )
                  }
                />
                <p className="text-xs text-zinc-400">
                  Max {maxQuantity} tickets ({remainingCapacity} remaining)
                </p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Ticket price × {quantity}
                  </span>
                  <span>{formatCurrencyDecimal(ticketPrice * quantity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Service fee × {quantity}
                  </span>
                  <span>{formatCurrencyDecimal(serviceFee * quantity)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-orange-600">
                    {formatCurrencyDecimal(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePledge}
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pledging...
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-4 w-4" />
                    Pledge {formatCurrencyDecimal(totalAmount)}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
