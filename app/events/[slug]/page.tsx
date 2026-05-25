import { notFound } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { TierSelector } from "@/components/events/TierSelector";
import { MapEmbed } from "@/components/shared/MapEmbed";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate, formatTime, EVENT_CATEGORY_LABELS } from "@/lib/utils";
import { Calendar, MapPin, Users, Star, Globe, Clock, Share2, Bookmark } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ slug: string }> }

async function getEvent(slug: string, userId?: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      organiser: {
        select: {
          id: true,
          name: true,
          image: true,
          organiserProfile: {
            select: { orgName: true, logoUrl: true, bio: true, website: true, isPro: true },
          },
        },
      },
      ticketTiers: { orderBy: { sortOrder: "asc" } },
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      _count: { select: { reviews: true } },
    },
  });
  if (!event || (!event.isPublished && event.organiserId !== userId)) return null;

  const avgRating = event.reviews.length > 0
    ? event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length
    : 0;

  let isBookmarked = false;
  if (userId) {
    const bm = await prisma.bookmark.findUnique({
      where: { userId_eventId: { userId, eventId: event.id } },
    });
    isBookmarked = !!bm;
  }

  const totalSold = event.ticketTiers.reduce((s, t) => s + t.sold, 0);
  const totalCapacity = event.ticketTiers.reduce((s, t) => s + t.capacity, 0);

  return {
    ...event,
    organiserProfile: event.organiser.organiserProfile,
    avgRating,
    isBookmarked,
    totalSold,
    totalCapacity,
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const event = await getEvent(slug, session?.user?.id);
  if (!event) notFound();

  return (
    <div className="min-h-screen bg-navy-700">
      <Navbar />

      {/* Hero banner */}
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        {event.bannerUrl ? (
          <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl"
            style={{ background: "linear-gradient(135deg,#0A1628,#1A3490)" }}>
            {EVENT_CATEGORY_LABELS[event.category]?.split(" ")[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-700 via-navy-700/40 to-transparent" />

        {/* Category + share */}
        <div className="absolute top-20 left-6 right-6 flex items-start justify-between">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm text-white/80 border border-white/15">
            {EVENT_CATEGORY_LABELS[event.category]}
          </span>
          <div className="flex gap-2">
            {/* Share button (client interaction handled inline) */}
            <button className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white border border-white/15 transition-all">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Event title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="font-clash text-3xl md:text-4xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
            {event.title}
          </h1>
          {!event.isPublished && (
            <span className="text-xs bg-gold-500/20 text-gold-500 border border-gold-500/30 px-2 py-0.5 rounded-lg font-semibold">
              Draft — not published
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Quick info strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Calendar, label: "Date", value: formatDate(event.startAt) },
                { icon: Clock, label: "Time", value: `${formatTime(event.startAt)} – ${formatTime(event.endAt)}` },
                { icon: MapPin, label: event.isOnline ? "Online" : "Venue", value: event.isOnline ? "Virtual Event" : event.city },
                { icon: Users, label: "Registered", value: `${event.totalSold} / ${event.totalCapacity}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">{label}</span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-tight">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="font-clash text-xl font-bold text-white mb-3">About this event</h2>
              <div className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Location */}
            {!event.isOnline && (
              <div>
                <h2 className="font-clash text-xl font-bold text-white mb-3">
                  <MapPin className="inline w-5 h-5 text-accent mr-2 -mt-0.5" />
                  Venue
                </h2>
                <p className="text-white/60 text-sm mb-3">{event.venue}, {event.city}</p>
                {event.address && <p className="text-white/40 text-xs mb-4">{event.address}</p>}
                {event.lat && event.lng ? (
                  <MapEmbed lat={event.lat} lng={event.lng} venue={event.venue} city={event.city} />
                ) : (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + " " + event.city)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-accent hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Open in Google Maps →
                  </a>
                )}
              </div>
            )}

            {/* Online link */}
            {event.isOnline && event.onlineUrl && (
              <div className="bg-teal-500/8 border border-teal-500/20 rounded-2xl p-4 flex items-center gap-3">
                <Globe className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">Online Event</p>
                  <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:underline truncate block max-w-xs">
                    {event.onlineUrl}
                  </a>
                </div>
              </div>
            )}

            {/* Organiser */}
            <div>
              <h2 className="font-clash text-xl font-bold text-white mb-3">Organised by</h2>
              <div className="flex items-center gap-3 p-4 bg-white/4 border border-white/8 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-lg font-bold text-accent flex-shrink-0">
                  {(event.organiserProfile?.orgName ?? event.organiser.name ?? "O")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">
                      {event.organiserProfile?.orgName ?? event.organiser.name}
                    </p>
                    {event.organiserProfile?.isPro && (
                      <span className="text-[10px] bg-gold-500/15 text-gold-500 border border-gold-500/25 px-2 py-0.5 rounded-full font-bold">PRO</span>
                    )}
                  </div>
                  {event.organiserProfile?.bio && (
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{event.organiserProfile.bio}</p>
                  )}
                  {event.organiserProfile?.website && (
                    <a href={event.organiserProfile.website} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline mt-0.5 block">
                      {event.organiserProfile.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews */}
            {event._count.reviews > 0 && (
              <div>
                <h2 className="font-clash text-xl font-bold text-white mb-1">
                  Reviews
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(event.avgRating) ? "text-gold-500 fill-gold-500" : "text-white/20"}`} />
                    ))}
                  </div>
                  <span className="font-bold text-white text-sm">{event.avgRating.toFixed(1)}</span>
                  <span className="text-white/40 text-xs">({event._count.reviews} reviews)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.reviews.map((review) => (
                    <div key={review.id} className="bg-white/3 border border-white/8 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                            {(review.user.name ?? "U")[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">{review.user.name}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-gold-500 fill-gold-500" : "text-white/15"}`} />
                          ))}
                        </div>
                      </div>
                      {review.body && <p className="text-xs text-white/50 leading-relaxed">{review.body}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — sticky ticket selector */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
                <h3 className="font-clash font-bold text-white text-lg mb-4">Get Tickets</h3>
                <TierSelector event={event} tiers={event.ticketTiers} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
