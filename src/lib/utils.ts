import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDecimal(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate service fee based on DAB pricing model:
 * - Under $15 ticket: $3.50 flat fee
 * - $15+ ticket: 12% of face value
 */
export function calculateServiceFee(ticketPrice: number): number {
  if (ticketPrice < 15) return 3.5;
  return Math.round(ticketPrice * 0.12 * 100) / 100;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const sameYear = s.getFullYear() === e.getFullYear();

  const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" });
  const dayNum = new Intl.DateTimeFormat("en-US", { day: "numeric" });

  if (sameMonth) {
    return `${monthShort.format(s)} ${dayNum.format(s)}–${dayNum.format(e)}, ${s.getFullYear()}`;
  }
  if (sameYear) {
    return `${monthShort.format(s)} ${dayNum.format(s)} – ${monthShort.format(e)} ${dayNum.format(e)}, ${s.getFullYear()}`;
  }
  return `${monthShort.format(s)} ${dayNum.format(s)}, ${s.getFullYear()} – ${monthShort.format(e)} ${dayNum.format(e)}, ${e.getFullYear()}`;
}

/**
 * Generate a short random ID for shareable links.
 * Uses URL-safe characters: lowercase + digits (no ambiguous chars like 0/O, 1/l).
 */
export function nanoid(length: number = 8): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
