import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat("-", nanoid(6));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function calculatePlatformFee(amount: number, rate = 0.03): number {
  return Math.round(amount * rate * 100) / 100;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  MUSIC: "🎵 Music",
  COLLEGE_FEST: "🎓 College Fest",
  TECH: "💻 Tech",
  COMEDY: "🎭 Comedy",
  FITNESS: "🏋️ Fitness",
  FOOD: "🍽️ Food & Culture",
  WORKSHOP: "📚 Workshop",
  SPORTS: "⚽ Sports",
  OTHER: "✨ Other",
};

export const TIER_TYPE_LABELS: Record<string, string> = {
  FREE: "Free",
  GENERAL: "General",
  VIP: "VIP",
  EARLY_BIRD: "Early Bird",
  PREMIUM: "Premium",
};
