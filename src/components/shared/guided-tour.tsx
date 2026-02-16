"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourStep {
  /** CSS selector or data-tour attribute value to highlight */
  target: string;
  /** Title shown in the tooltip */
  title: string;
  /** Description text */
  description: string;
  /** Which side to show the tooltip */
  placement?: "top" | "bottom" | "left" | "right";
}

interface GuidedTourProps {
  /** Unique key for this tour (used in localStorage) */
  tourId: string;
  /** User ID to namespace the localStorage key */
  userId?: string;
  /** Steps to show */
  steps: TourStep[];
  /** Delay before showing the tour (ms) */
  delay?: number;
  /** Called when tour completes or is dismissed */
  onComplete?: () => void;
}

export function GuidedTour({
  tourId,
  userId,
  steps,
  delay = 800,
  onComplete,
}: GuidedTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [placement, setPlacement] = useState<"top" | "bottom" | "left" | "right">("bottom");
  const tooltipRef = useRef<HTMLDivElement>(null);

  const storageKey = `dab-tour-${tourId}${userId ? `-${userId}` : ""}`;

  // Check if tour has been completed
  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (seen) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [storageKey, delay]);

  // Position the tooltip relative to the target element
  const positionTooltip = useCallback(() => {
    if (!isVisible || steps.length === 0) return;

    const step = steps[currentStep];
    const target = document.querySelector(
      `[data-tour="${step.target}"], ${step.target}`
    );

    if (!target) {
      // If target not found, show tooltip in center
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth || 320;
    const tooltipHeight = tooltipEl?.offsetHeight || 200;
    const padding = 12;
    const arrowSize = 8;

    // Add highlight to target
    target.classList.add("tour-highlight");

    // Scroll target into view if needed
    const isInView =
      rect.top >= 0 &&
      rect.bottom <= window.innerHeight;
    if (!isInView) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      // Re-position after scroll
      setTimeout(() => positionTooltip(), 400);
      return;
    }

    // Determine best placement
    const preferredPlacement = step.placement || "bottom";
    let actualPlacement = preferredPlacement;

    // Check if there's room for the preferred placement
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    if (actualPlacement === "bottom" && spaceBelow < tooltipHeight + padding * 2) {
      actualPlacement = spaceAbove > spaceBelow ? "top" : "bottom";
    }
    if (actualPlacement === "top" && spaceAbove < tooltipHeight + padding * 2) {
      actualPlacement = spaceBelow > spaceAbove ? "bottom" : "top";
    }

    setPlacement(actualPlacement);

    let top = 0;
    let left = 0;

    switch (actualPlacement) {
      case "bottom":
        top = rect.bottom + padding + arrowSize;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowStyle({
          position: "absolute",
          top: -arrowSize,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid white`,
        });
        break;
      case "top":
        top = rect.top - tooltipHeight - padding - arrowSize;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowStyle({
          position: "absolute",
          bottom: -arrowSize,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid white`,
        });
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding + arrowSize;
        setArrowStyle({
          position: "absolute",
          left: -arrowSize,
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid white`,
        });
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding - arrowSize;
        setArrowStyle({
          position: "absolute",
          right: -arrowSize,
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid white`,
        });
        break;
    }

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    setTooltipStyle({
      position: "fixed",
      top,
      left,
    });
  }, [isVisible, currentStep, steps]);

  useEffect(() => {
    if (!isVisible) return;
    positionTooltip();

    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);

    return () => {
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);

      // Clean up highlights
      document.querySelectorAll(".tour-highlight").forEach((el) => {
        el.classList.remove("tour-highlight");
      });
    };
  }, [isVisible, positionTooltip]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    // Clean up highlights
    document.querySelectorAll(".tour-highlight").forEach((el) => {
      el.classList.remove("tour-highlight");
    });
    onComplete?.();
  }, [storageKey, onComplete]);

  const handleNext = useCallback(() => {
    // Remove highlight from current target
    const currentTarget = document.querySelector(
      `[data-tour="${steps[currentStep].target}"], ${steps[currentStep].target}`
    );
    currentTarget?.classList.remove("tour-highlight");

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  }, [currentStep, steps, handleDismiss]);

  const handlePrev = useCallback(() => {
    const currentTarget = document.querySelector(
      `[data-tour="${steps[currentStep].target}"], ${steps[currentStep].target}`
    );
    currentTarget?.classList.remove("tour-highlight");

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, steps]);

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 transition-opacity duration-300"
        onClick={handleDismiss}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className={cn(
          "z-[9999] w-80 rounded-xl bg-white shadow-2xl border border-zinc-200",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Arrow */}
        <div style={arrowStyle} />

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100">
                <Sparkles className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-sm text-zinc-900">
                {step.title}
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-zinc-600 transition-colors p-0.5"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <p className="text-sm text-zinc-600 leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === currentStep
                      ? "w-4 bg-orange-500"
                      : i < currentStep
                        ? "w-1.5 bg-orange-300"
                        : "w-1.5 bg-zinc-200"
                  )}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="h-8 px-3 text-xs bg-orange-600 hover:bg-orange-700"
              >
                {isLast ? (
                  "Got it!"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Simple welcome banner for first-time visitors to a page.
 * Shows once per user, dismissed via localStorage.
 */
interface WelcomeBannerProps {
  bannerId: string;
  userId?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function WelcomeBanner({
  bannerId,
  userId,
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
}: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `dab-banner-${bannerId}${userId ? `-${userId}` : ""}`;

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      // Small delay for a nice entrance
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="animate-in slide-in-from-top-4 fade-in-0 duration-500 mb-6">
      <div className="relative rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
              {icon}
            </div>
          )}
          <div className="flex-1 pr-6">
            <h3 className="font-semibold text-zinc-900">{title}</h3>
            <p className="mt-1 text-sm text-zinc-600 leading-relaxed">
              {description}
            </p>
            {(actionLabel && actionHref) && (
              <a href={actionHref}>
                <Button
                  size="sm"
                  className="mt-3 bg-orange-600 hover:bg-orange-700"
                  onClick={onAction}
                >
                  {actionLabel}
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </a>
            )}
            {(actionLabel && onAction && !actionHref) && (
              <Button
                size="sm"
                className="mt-3 bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  onAction();
                  handleDismiss();
                }}
              >
                {actionLabel}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
