"use client";
import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";
import { ArrowRight } from "lucide-react";
import type { EventWithRelations } from "@/types";

export function FeaturedEvents({ events }: { events: EventWithRelations[] }) {
  const featured = events.filter((e) => e.isFeatured).slice(0, 2);
  const rest = events.filter((e) => !e.isFeatured).slice(0, 6);

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-2">Live Now</p>
          <h2 className="font-clash text-4xl font-bold text-white">Trending Events</h2>
        </div>
        <Link
          href="/events"
          className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-accent transition-colors"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <p className="text-5xl mb-4">🎟️</p>
          <p className="font-clash text-xl">Events coming soon</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Featured row */}
          {featured.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((e) => <EventCard key={e.id} event={e} variant="featured" />)}
            </div>
          )}
          {/* Regular grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}
    </section>
  );
}
