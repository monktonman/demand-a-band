"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Ticket, Loader2, CheckCircle, AlertCircle, LogIn, CreditCard, Lock } from "lucide-react";
import { formatCurrencyDecimal } from "@/lib/utils";
import Link from "next/link";
import { StripeProvider } from "@/components/providers/stripe-provider";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface PledgeButtonProps {
  eventId: string;
  ticketPrice: number;
  serviceFee: number;
  maxCapacity: number;
  currentPledges: number;
  isAcceptingPledges: boolean;
  userHasPledged: boolean;
  pledgeDeadline?: string;
}

// Inner form component that uses Stripe hooks (must be inside Elements provider)
function PledgeForm({
  eventId,
  quantity,
  totalAmount,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
}: {
  eventId: string;
  quantity: number;
  totalAmount: number;
  onSuccess: () => void;
  onError: (msg: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardReady, setCardReady] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    onError("");

    try {
      // Confirm the SetupIntent to save the payment method
      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (stripeError) {
        throw new Error(stripeError.message || "Card verification failed");
      }

      if (!setupIntent?.payment_method) {
        throw new Error("Payment method was not saved");
      }

      // Now create the pledge with the saved payment method
      const res = await fetch("/api/pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          quantity,
          paymentMethodId: setupIntent.payment_method,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create pledge");
      }

      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4 text-zinc-500" />
          Payment Method
        </Label>
        <div className="rounded-md border border-zinc-200 p-3">
          <PaymentElement
            onChange={(e) => setCardReady(e.complete)}
            options={{
              layout: "accordion",
              defaultValues: {
                billingDetails: {
                  address: {
                    country: "US",
                  },
                },
              },
            }}
          />
        </div>
        <p className="flex items-center gap-1 text-xs text-zinc-400">
          <Lock className="h-3 w-3" />
          Your card is saved securely. You&apos;re only charged if the show is confirmed.
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !stripe || !cardReady}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving card &amp; pledging...
            </>
          ) : (
            <>
              <Ticket className="mr-2 h-4 w-4" />
              Pledge {formatCurrencyDecimal(totalAmount)}
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}

// Saved payment method selector + pledge flow (no new card needed)
function SavedCardPledge({
  eventId,
  quantity,
  totalAmount,
  savedCards,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
  onUseNewCard,
}: {
  eventId: string;
  quantity: number;
  totalAmount: number;
  savedCards: { id: string; brand: string; last4: string; expMonth?: number; expYear?: number }[];
  onSuccess: () => void;
  onError: (msg: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  onUseNewCard: () => void;
}) {
  const [selectedCard, setSelectedCard] = useState(savedCards[0]?.id || "");

  const handlePledge = async () => {
    setIsSubmitting(true);
    onError("");

    try {
      const res = await fetch("/api/pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          quantity,
          paymentMethodId: selectedCard,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create pledge");
      }

      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Saved Payment Method</Label>
        <div className="space-y-2">
          {savedCards.map((card) => (
            <label
              key={card.id}
              className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                selectedCard === card.id
                  ? "border-orange-500 bg-orange-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={card.id}
                checked={selectedCard === card.id}
                onChange={() => setSelectedCard(card.id)}
                className="accent-orange-600"
              />
              <CreditCard className="h-4 w-4 text-zinc-500" />
              <span className="text-sm">
                <span className="capitalize">{card.brand}</span> ending in {card.last4}
                {card.expMonth && card.expYear && (
                  <span className="text-zinc-400">
                    {" "}
                    · {card.expMonth}/{card.expYear}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={onUseNewCard}
          className="text-xs text-orange-600 hover:underline"
        >
          + Use a different card
        </button>
      </div>

      <DialogFooter>
        <Button
          type="button"
          onClick={handlePledge}
          disabled={isSubmitting || !selectedCard}
          className="w-full bg-orange-600 hover:bg-orange-700"
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
    </div>
  );
}

export function PledgeButton({
  eventId,
  ticketPrice,
  serviceFee,
  maxCapacity,
  currentPledges,
  isAcceptingPledges,
  userHasPledged,
  pledgeDeadline,
}: PledgeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Payment state
  const [step, setStep] = useState<"quantity" | "payment">("quantity");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<
    { id: string; brand: string; last4: string; expMonth?: number; expYear?: number }[]
  >([]);
  const [useNewCard, setUseNewCard] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const totalPerTicket = ticketPrice + serviceFee;
  const totalAmount = totalPerTicket * quantity;
  const remainingCapacity = maxCapacity - currentPledges;
  const maxQuantity = Math.min(remainingCapacity, 10); // Max 10 tickets per pledge

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setStep("quantity");
      setError("");
      setSuccess(false);
      setClientSecret(null);
      setUseNewCard(false);
      setQuantity(1);
    }
  }, [isOpen]);

  const initPayment = useCallback(async () => {
    setLoadingPayment(true);
    setError("");

    try {
      // Fetch saved cards and setup intent in parallel
      const [cardsRes, setupRes] = await Promise.all([
        fetch("/api/setup-intent"),
        fetch("/api/setup-intent", { method: "POST" }),
      ]);

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setSavedCards(cardsData.paymentMethods || []);
      }

      if (setupRes.ok) {
        const setupData = await setupRes.json();
        setClientSecret(setupData.clientSecret);
      } else {
        throw new Error("Failed to initialize payment");
      }

      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment form");
    } finally {
      setLoadingPayment(false);
    }
  }, []);

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      setIsOpen(false);
      router.refresh();
    }, 2000);
  };

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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold">Pledge Confirmed!</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Your card is saved. You&apos;ll only be charged if the show is confirmed.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {step === "quantity" ? "Confirm Your Pledge" : "Payment Method"}
              </DialogTitle>
              <DialogDescription>
                {step === "quantity"
                  ? "You won't be charged now. Your card is only charged when the show is confirmed by our team."
                  : "Save a payment method for this pledge. You won't be charged until the show is confirmed."}
              </DialogDescription>
              {step === "quantity" && pledgeDeadline && (
                <p className="text-xs text-zinc-500 mt-1">
                  Pledge deadline:{" "}
                  {new Date(pledgeDeadline).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </DialogHeader>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {step === "quantity" && (
              <>
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
                    disabled={loadingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={initPayment}
                    disabled={loadingPayment}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {loadingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Continue to Payment
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}

            {step === "payment" && (
              <>
                {/* Price summary */}
                <div className="rounded-md bg-zinc-50 p-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>
                      {quantity} ticket{quantity > 1 ? "s" : ""}
                    </span>
                    <span className="text-orange-600">
                      {formatCurrencyDecimal(totalAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("quantity")}
                    className="mt-1 text-xs text-orange-600 hover:underline"
                  >
                    ← Change quantity
                  </button>
                </div>

                {/* Show saved cards or new card form */}
                {savedCards.length > 0 && !useNewCard ? (
                  <SavedCardPledge
                    eventId={eventId}
                    quantity={quantity}
                    totalAmount={totalAmount}
                    savedCards={savedCards}
                    onSuccess={handleSuccess}
                    onError={setError}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                    onUseNewCard={() => setUseNewCard(true)}
                  />
                ) : clientSecret ? (
                  <StripeProvider clientSecret={clientSecret}>
                    <PledgeForm
                      eventId={eventId}
                      quantity={quantity}
                      totalAmount={totalAmount}
                      onSuccess={handleSuccess}
                      onError={setError}
                      isSubmitting={isSubmitting}
                      setIsSubmitting={setIsSubmitting}
                    />
                  </StripeProvider>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
