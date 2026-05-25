import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency, EVENT_CATEGORY_LABELS } from "@/lib/utils";
import { EventActionButtons } from "@/components/dashboard/EventActionButtons";
import { DiscountCodeManager } from "@/components/dashboard/DiscountCodeManager";
import Link from "next/link";
import {
  Calendar, MapPin, Ticket, Users, TrendingUp,
  ScanLine, Download, ArrowLeft, Globe,
} from "lucide-react";

async function getEventDetail(eventId: string, organiserId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ticketTiers: { orderBy: { sortOrder: "asc" } },
      discountCodes: { orderBy: { createdAt: "desc" } },
      _count: { select: { reviews: true } },
    },
  });
  if (!event || (event.organiserId !== organiserId)) return null;

  const [revenueAgg, checkedInCount, recentAttendees] = await Promise.all([
    prisma.order.aggregate({
      where: { eventId, status: "PAID" },
      _sum: { totalAmount: true, platformFee: true },
      _count: { id: true },
    }),
    prisma.ticket.count({ where: { tier: { eventId }, isCheckedIn: true } }),
    prisma.ticket.findMany({
      where: { tier: { eventId }, order: { status: "PAID" } },
      include: { tier: { select: { name: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalSold = event.ticketTiers.reduce((s, t) => s + t.sold, 0);
  const totalCapacity = event.ticketTiers.reduce((s, t) => s + t.capacity, 0);

  return {
    ...event,
    revenue: revenueAgg._sum.totalAmount ?? 0,
    platformFee: revenueAgg._sum.platformFee ?? 0,
    totalOrders: revenueAgg._count.id,
    totalSold,
    totalCapacity,
    checkedIn: checkedInCount,
    checkInRate: totalSold > 0 ? Math.round((checkedInCount / totalSold) * 100) : 0,
    recentAttendees,
  };
}

export default async function EventManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const event = await getEventDetail(id, session.user.id);
  if (!event) notFound();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/dashboard" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="font-clash text-2xl font-bold text-white">{event.title}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                event.isPublished
                  ? "bg-teal-500/15 text-teal-400 border border-teal-500/25"
                  : "bg-gold-500/15 text-gold-500 border border-gold-500/25"
              }`}>
                {event.isPublished ? "● Live" : "● Draft"}
              </span>
              {event.isFeatured && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                  ⭐ Featured
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm">
              {EVENT_CATEGORY_LABELS[event.category]} · {formatDate(event.startAt)}
            </p>
          </div>
          <EventActionButtons event={event} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Revenue", value: formatCurrency(event.revenue), color: "text-accent" },
          { icon: Ticket, label: "Tickets Sold", value: `${event.totalSold} / ${event.totalCapacity}`, color: "text-teal-400" },
          { icon: Users, label: "Orders", value: String(event.totalOrders), color: "text-purple-400" },
          { icon: ScanLine, label: "Check-in Rate", value: `${event.checkInRate}%`, color: "text-gold-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className={`font-clash font-bold text-lg ${color}`}>{value}</p>
            <p className="text-xs text-white/35">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket tiers breakdown */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <h2 className="font-clash font-bold text-white">Ticket Tiers</h2>
            <a
              href={`/api/organiser/events/${event.id}/attendees?format=csv`}
              className="flex items-center gap-1.5 text-xs text-teal-400 hover:underline"
            >
              <Download className="w-3 h-3" /> Export CSV
            </a>
          </div>
          <div className="divide-y divide-white/4">
            {event.ticketTiers.map((tier) => {
              const pct = tier.capacity > 0 ? (tier.sold / tier.capacity) * 100 : 0;
              return (
                <div key={tier.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-semibold text-white">{tier.name}</span>
                      <span className="text-xs text-white/35 ml-2">({tier.type})</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">
                        {tier.price === 0 ? "FREE" : formatCurrency(tier.price)}
                      </p>
                      <p className="text-xs text-white/35">{tier.sold}/{tier.capacity} sold</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: pct > 80 ? "#EF4444" : pct > 50 ? "#FFB800" : "#00D4AA",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent attendees */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <h2 className="font-clash font-bold text-white">Recent Attendees</h2>
            <Link href="/dashboard/attendees" className="text-xs text-accent hover:underline">
              View all →
            </Link>
          </div>
          {event.recentAttendees.length === 0 ? (
            <div className="py-10 text-center text-white/25 text-sm">No attendees yet</div>
          ) : (
            <div className="divide-y divide-white/4">
              {event.recentAttendees.map((ticket: any) => (
                <div key={ticket.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                    {ticket.attendeeName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ticket.attendeeName}</p>
                    <p className="text-xs text-white/35">{ticket.attendeeEmail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      ticket.isCheckedIn
                        ? "bg-teal-500/15 text-teal-400"
                        : "bg-white/8 text-white/40"
                    }`}>
                      {ticket.isCheckedIn ? "✓ In" : ticket.tier.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discount codes */}
      <DiscountCodeManager eventId={event.id} initialCodes={event.discountCodes} />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/dashboard/checkin/${event.id}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 text-sm font-semibold hover:bg-teal-500/25 transition-all">
          <ScanLine className="w-4 h-4" /> Open Check-in
        </Link>
        <a href={`/api/organiser/events/${event.id}/attendees?format=csv`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white/70 text-sm font-semibold hover:text-white hover:bg-white/10 transition-all">
          <Download className="w-4 h-4" /> Download Attendees CSV
        </a>
        <Link href={`/events/${event.slug}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white/70 text-sm font-semibold hover:text-white hover:bg-white/10 transition-all">
          <Globe className="w-4 h-4" /> View Public Page
        </Link>
      </div>
    </div>
  );
}
