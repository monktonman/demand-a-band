"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Loader2,
  Music2,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { formatCurrency, calculateServiceFee } from "@/lib/utils";
import {
  PRICE_QUICK_OPTIONS,
  DREAM_SHOW_MIN_PRICE,
} from "@/lib/constants";
import type { SelectedBand } from "@/app/(main)/onboarding/page";

interface StepPricingProps {
  selectedBands: SelectedBand[];
  setSelectedBands: React.Dispatch<React.SetStateAction<SelectedBand[]>>;
  onSave: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function StepPricing({
  selectedBands,
  setSelectedBands,
  onSave,
  onBack,
  isSubmitting,
}: StepPricingProps) {
  const updatePrice = (bandId: string, price: number) => {
    setSelectedBands((prev) =>
      prev.map((b) =>
        b.id === bandId
          ? {
              ...b,
              maxTicketPrice: price,
              // Auto-enable dream show if price is high enough
              isDreamShow: price >= DREAM_SHOW_MIN_PRICE ? b.isDreamShow : false,
            }
          : b
      )
    );
  };

  const toggleDreamShow = (bandId: string, enabled: boolean) => {
    setSelectedBands((prev) =>
      prev.map((b) =>
        b.id === bandId
          ? {
              ...b,
              isDreamShow: enabled,
              // Bump price to minimum for dream shows
              maxTicketPrice: enabled
                ? Math.max(b.maxTicketPrice, DREAM_SHOW_MIN_PRICE)
                : b.maxTicketPrice,
            }
          : b
      )
    );
  };

  const dreamShowCount = selectedBands.filter((b) => b.isDreamShow).length;

  return (
    <div className="space-y-6">
      {/* Dream show explanation */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-900">
              Dream Show Experience
            </h3>
            <p className="mt-1 text-sm text-amber-700">
              Toggle &ldquo;Dream Show&rdquo; for artists you&apos;d pay a
              premium to see in an intimate setting. Think a stadium act in a
              400-seat room. These signals help us negotiate once-in-a-lifetime
              experiences.
            </p>
          </div>
        </div>
      </Card>

      {/* Band pricing cards */}
      <div className="space-y-3">
        {selectedBands.map((band) => {
          const serviceFee = calculateServiceFee(band.maxTicketPrice);
          const totalPrice = band.maxTicketPrice + serviceFee;

          return (
            <Card
              key={band.id}
              className={`p-4 transition-colors ${
                band.isDreamShow
                  ? "border-amber-300 bg-amber-50/50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200">
                    <Music2 className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div>
                    <p className="font-medium">{band.name}</p>
                    <p className="text-xs text-zinc-500">
                      {band.genres.slice(0, 2).join(" / ")}
                    </p>
                  </div>
                </div>

                {/* Dream show toggle */}
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`dream-${band.id}`}
                    className="text-xs text-amber-600"
                  >
                    {band.isDreamShow && (
                      <Badge className="bg-amber-500 text-xs">Dream Show</Badge>
                    )}
                  </Label>
                  <Switch
                    id={`dream-${band.id}`}
                    checked={band.isDreamShow}
                    onCheckedChange={(checked) =>
                      toggleDreamShow(band.id, checked)
                    }
                  />
                </div>
              </div>

              {/* Price selection */}
              <div className="mt-4">
                <div className="flex items-center gap-1 text-sm text-zinc-600">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Max ticket price</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRICE_QUICK_OPTIONS.filter(
                    (p) => !band.isDreamShow || p >= DREAM_SHOW_MIN_PRICE
                  ).map((price) => (
                    <button
                      key={price}
                      onClick={() => updatePrice(band.id, price)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        band.maxTicketPrice === price
                          ? "border-orange-600 bg-orange-600 text-white"
                          : "border-zinc-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {formatCurrency(price)}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    + {formatCurrency(serviceFee)} service fee
                  </span>
                  <span className="font-medium text-zinc-600">
                    Total: {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-zinc-100 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-600">Bands selected</span>
          <span className="font-medium">{selectedBands.length}</span>
        </div>
        {dreamShowCount > 0 && (
          <div className="mt-1 flex justify-between">
            <span className="text-amber-600">Dream shows</span>
            <span className="font-medium text-amber-600">{dreamShowCount}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onSave}
          disabled={isSubmitting}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
