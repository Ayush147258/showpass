"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Users, Heart } from "lucide-react";
import { cn, formatCurrency, formatDate, EVENT_CATEGORY_LABELS } from "@/lib/utils";
import { getTheme } from "@/lib/ticket-themes";
import type { EventWithRelations } from "@/types";
import { useState } from "react";

interface EventCardProps {
  event: EventWithRelations;
  variant?: "default" | "featured" | "compact";
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
  const theme = getTheme(event.category);
  const [bookmarked, setBookmarked] = useState(event.isBookmarked ?? false);
  const lowestPrice = event.ticketTiers.reduce(
    (min, t) => (t.price < min ? t.price : min),
    event.ticketTiers[0]?.price ?? 0
  );
  const isFree = lowestPrice === 0;
  const totalCapacity = event.ticketTiers.reduce((s, t) => s + t.capacity, 0);
  const totalSold = event.ticketTiers.reduce((s, t) => s + t.sold, 0);
  const soldPct = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
  const almostSoldOut = soldPct > 80;

  if (variant === "compact") {
    return (
      <Link href={`/events/${event.slug}`} className="event-card flex gap-3 p-3 bg-white/4 border border-white/8 rounded-2xl hover:border-accent/30 hover:bg-white/6">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
          {event.bannerUrl ? (
            <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: theme.bg }}>
              {EVENT_CATEGORY_LABELS[event.category]?.split(" ")[0]}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{event.title}</p>
          <p className="text-xs text-white/50 mt-0.5">{formatDate(event.startAt)}</p>
          <p className="text-xs text-accent font-semibold mt-1">
            {isFree ? "Free" : `From ${formatCurrency(lowestPrice)}`}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.slug}`} className={cn("event-card group block", variant === "featured" && "md:col-span-2")}>
      {/* Banner */}
      <div className={cn("relative overflow-hidden rounded-2xl", variant === "featured" ? "h-64" : "h-48")}>
        {event.bannerUrl ? (
          <Image
            src={event.bannerUrl}
            alt={event.title}
            fill
            className="object-cover event-card-img transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            style={{ background: theme.bg }}
          >
            {EVENT_CATEGORY_LABELS[event.category]?.split(" ")[0]}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-700/90 via-navy-700/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm"
            style={{ background: `rgba(${theme.accentRgb}, 0.2)`, color: theme.accent, border: `1px solid rgba(${theme.accentRgb}, 0.3)` }}
          >
            {EVENT_CATEGORY_LABELS[event.category]}
          </span>
          <button
            onClick={(e) => { e.preventDefault(); setBookmarked(!bookmarked); }}
            className={cn("w-8 h-8 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all", bookmarked ? "bg-accent text-white" : "bg-black/30 text-white/60 hover:text-white")}
          >
            <Heart className={cn("w-3.5 h-3.5", bookmarked && "fill-current")} />
          </button>
        </div>

        {/* Almost sold out */}
        {almostSoldOut && (
          <div className="absolute bottom-3 left-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/90 text-white backdrop-blur-sm animate-pulse-glow">
              🔥 Almost Full
            </span>
          </div>
        )}

        {/* Price */}
        <div className="absolute bottom-3 right-3">
          <span className={cn("text-sm font-bold px-3 py-1 rounded-xl backdrop-blur-sm border", isFree ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-black/40 text-white border-white/20")}>
            {isFree ? "FREE" : `₹${lowestPrice.toLocaleString("en-IN")}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-clash font-semibold text-base text-white leading-tight mb-2 group-hover:text-accent transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{formatDate(event.startAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{event.city}</span>
          </div>
        </div>

        {/* Sold bar */}
        {totalCapacity > 0 && (
          <div className="mt-3">
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(soldPct, 100)}%`,
                  background: soldPct > 80 ? "#EF4444" : soldPct > 50 ? "#FFB800" : theme.accent,
                }}
              />
            </div>
            <p className="text-[10px] text-white/30 mt-1">
              {totalSold} / {totalCapacity} registered
            </p>
          </div>
        )}

        {/* Organiser */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent">
              {(event.organiser.name ?? "?")[0].toUpperCase()}
            </div>
            <span className="text-xs text-white/40 truncate max-w-[120px]">{event.organiser.name}</span>
          </div>
          {event._count.reviews > 0 && (
            <div className="flex items-center gap-1 text-xs text-gold-500">
              <span>⭐</span>
              <span>{event._count.reviews} reviews</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
