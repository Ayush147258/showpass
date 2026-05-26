import { Suspense } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCard } from "@/components/events/EventCard";
import { prisma } from "@/lib/prisma";
import type { EventCategory } from "@prisma/client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

type EventSearchParams = {
  category?: string; city?: string; price?: string;
  search?: string; page?: string; free?: string;
};

interface PageProps {
  searchParams: Promise<EventSearchParams>;
}

async function getEvents(searchParams: EventSearchParams) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 12;

  const where: Record<string, unknown> = { isPublished: true };

  if (searchParams.category) where.category = searchParams.category as EventCategory;
  if (searchParams.city) where.city = { contains: searchParams.city, mode: "insensitive" };
  if (searchParams.price === "free" || searchParams.free === "true") {
    where.ticketTiers = { some: { price: 0 } };
  } else if (searchParams.price) {
    const [min, max] = searchParams.price.split("-").map(Number);
    where.ticketTiers = { some: { price: { gte: min, lte: max } } };
  }
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
      { city: { contains: searchParams.search, mode: "insensitive" } },
      { venue: { contains: searchParams.search, mode: "insensitive" } },
    ];
  }

  try {
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organiser: { select: { id: true, name: true, image: true } },
          ticketTiers: { orderBy: { sortOrder: "asc" } },
          _count: { select: { reviews: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { startAt: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total, page, pages: Math.ceil(total / limit) };
  } catch (error) {
    console.error("Failed to load events", error);
    return { events: [], total: 0, page, pages: 0 };
  }
}
export default async function EventsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { events, total, page, pages } = await getEvents(sp);
  const hasFilters = !!(sp.category || sp.city || sp.price || sp.search);

  return (
    <div className="min-h-screen bg-navy-700">
      <Navbar />

      {/* Hero strip */}
      <div className="pt-24 pb-8 px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-clash text-4xl font-bold text-white mb-1">
            {sp.category
              ? `${getCategoryLabel(sp.category)} Events`
              : sp.search
              ? `Results for "${sp.search}"`
              : "Discover Events"}
          </h1>
          <p className="text-white/40 text-sm">
            {total > 0 ? `${total} event${total !== 1 ? "s" : ""} found` : "No events found"}
            {sp.city ? ` in ${sp.city}` : ""}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-8">
          <Suspense>
            <EventFilters />
          </Suspense>
        </div>

        {/* Grid */}
        {events.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="font-clash text-2xl font-bold text-white mb-2">No events found</h3>
            <p className="text-white/40 mb-6">
              {hasFilters ? "Try adjusting your filters." : "Check back soon — events are being added daily."}
            </p>
            {hasFilters && (
              <Link href="/events" className="btn-primary inline-flex">Clear all filters</Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {events.map((event) => (
                <EventCard key={event.id} event={event as any} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <PaginationLink
                  href={buildPageUrl(sp, page - 1)}
                  disabled={page <= 1}
                  icon={<ChevronLeft className="w-4 h-4" />}
                />
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  const p = pages <= 7 ? i + 1 : getPageNumber(i, page, pages);
                  return (
                    <PaginationLink
                      key={p}
                      href={buildPageUrl(sp, p)}
                      active={p === page}
                      label={String(p)}
                    />
                  );
                })}
                <PaginationLink
                  href={buildPageUrl(sp, page + 1)}
                  disabled={page >= pages}
                  icon={<ChevronRight className="w-4 h-4" />}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

function getCategoryLabel(cat: string) {
  const map: Record<string, string> = {
    MUSIC: "🎵 Music", COLLEGE_FEST: "🎓 College Fest", TECH: "💻 Tech",
    COMEDY: "🎭 Comedy", FITNESS: "🏋️ Fitness", FOOD: "🍽️ Food",
    WORKSHOP: "📚 Workshop", SPORTS: "⚽ Sports",
  };
  return map[cat] ?? cat;
}

function buildPageUrl(sp: Record<string, string | undefined>, p: number) {
  const params = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => { if (v && k !== "page") params.set(k, v); });
  params.set("page", String(p));
  return `/events?${params.toString()}`;
}

function getPageNumber(i: number, current: number, total: number) {
  if (total <= 7) return i + 1;
  if (i === 0) return 1;
  if (i === 6) return total;
  if (current <= 3) return i + 1;
  if (current >= total - 2) return total - 6 + i;
  return current - 3 + i;
}

function PaginationLink({ href, active, disabled, label, icon }: {
  href: string; active?: boolean; disabled?: boolean; label?: string; icon?: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="w-9 h-9 flex items-center justify-center rounded-xl text-white/20 text-sm">
        {icon ?? label}
      </span>
    );
  }
  return (
    <Link href={href} className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
      active ? "bg-accent text-white shadow-glow-accent/30" : "text-white/50 hover:text-white hover:bg-white/8"
    }`}>
      {icon ?? label}
    </Link>
  );
}
