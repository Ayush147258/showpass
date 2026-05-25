import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { formatCurrency, formatDateTime, EVENT_CATEGORY_LABELS } from "@/lib/utils";
import {
  IndianRupee, Ticket, CalendarCheck, TrendingUp,
  Users, Clock, ArrowRight, Plus, ScanLine,
} from "lucide-react";
import Link from "next/link";
import { subDays, format, eachDayOfInterval } from "date-fns";
import type { RevenueDataPoint } from "@/types";

async function getDashboardData(organiserId: string) {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  const [
    allEvents,
    revenueAll,
    revenueThis,
    revenueLast,
    ticketsSold,
    checkedIn,
    totalTickets,
    recentOrders,
    dailyOrders,
    upcomingEvents,
  ] = await Promise.all([
    prisma.event.count({ where: { organiserId } }),
    prisma.order.aggregate({ where: { event: { organiserId }, status: "PAID" }, _sum: { totalAmount: true, platformFee: true }, _count: { id: true } }),
    prisma.order.aggregate({ where: { event: { organiserId }, status: "PAID", createdAt: { gte: thirtyDaysAgo } }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({ where: { event: { organiserId }, status: "PAID", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }, _sum: { totalAmount: true } }),
    prisma.ticket.count({ where: { tier: { event: { organiserId } }, order: { status: "PAID" } } }),
    prisma.ticket.count({ where: { tier: { event: { organiserId } }, order: { status: "PAID" }, isCheckedIn: true } }),
    prisma.ticket.count({ where: { tier: { event: { organiserId } }, order: { status: "PAID" } } }),
    prisma.order.findMany({
      where: { event: { organiserId }, status: "PAID" },
      include: {
        buyer: { select: { name: true, email: true, image: true } },
        event: { select: { title: true, slug: true } },
        orderItems: { include: { tier: { select: { name: true, type: true } } }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
    prisma.$queryRaw<{ date: Date; revenue: number; count: bigint }[]>`
      SELECT DATE("createdAt") as date,
             SUM("totalAmount")::float as revenue,
             COUNT(*)::bigint as count
      FROM "Order"
      WHERE "status" = 'PAID'
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    prisma.event.findMany({
      where: { organiserId, startAt: { gte: now }, isPublished: true },
      include: { ticketTiers: { select: { capacity: true, sold: true } } },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
  ]);

  const thisMonth = revenueThis._sum.totalAmount ?? 0;
  const lastMonth = revenueLast._sum.totalAmount ?? 0;
  const revenueChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  const checkInRate = totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0;

  // Build 30-day chart
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
  const revenueMap = new Map<string, { revenue: number; tickets: number }>();
  for (const row of dailyOrders) {
    const key = format(new Date(row.date), "MMM d");
    revenueMap.set(key, { revenue: Number(row.revenue), tickets: Number(row.count) });
  }
  const chartData: RevenueDataPoint[] = days.map((day) => {
    const key = format(day, "MMM d");
    const r = revenueMap.get(key);
    return { date: key, revenue: r?.revenue ?? 0, tickets: r?.tickets ?? 0 };
  });

  return {
    kpis: {
      totalRevenue: revenueAll._sum.totalAmount ?? 0,
      netRevenue: (revenueAll._sum.totalAmount ?? 0) - (revenueAll._sum.platformFee ?? 0),
      totalOrders: revenueAll._count.id,
      ticketsSold,
      revenueThisMonth: thisMonth,
      revenueChange: Math.round(revenueChange * 10) / 10,
      allEvents,
      checkInRate,
    },
    chartData,
    recentOrders,
    upcomingEvents: upcomingEvents.map((e) => ({
      ...e,
      totalSold: e.ticketTiers.reduce((s, t) => s + t.sold, 0),
      totalCapacity: e.ticketTiers.reduce((s, t) => s + t.capacity, 0),
    })),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const data = await getDashboardData(session.user.id);
  const { kpis, chartData, recentOrders, upcomingEvents } = data;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-clash text-3xl font-bold text-white">
            Hey, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">Here's how your events are performing</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-600 transition-all shadow-glow-accent/30"
        >
          <Plus className="w-4 h-4" /> Create Event
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          change={kpis.revenueChange}
          icon={IndianRupee}
          iconColor="text-accent"
          iconBg="bg-accent/15"
        />
        <KpiCard
          title="Tickets Sold"
          value={kpis.ticketsSold.toLocaleString("en-IN")}
          icon={Ticket}
          iconColor="text-teal-400"
          iconBg="bg-teal-500/15"
        />
        <KpiCard
          title="Total Events"
          value={String(kpis.allEvents)}
          icon={CalendarCheck}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/15"
        />
        <KpiCard
          title="Check-in Rate"
          value={String(kpis.checkInRate)}
          suffix="%"
          icon={Users}
          iconColor="text-gold-500"
          iconBg="bg-gold-500/15"
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-clash font-bold text-white">Revenue — Last 30 Days</h2>
            <p className="text-xs text-white/35 mt-0.5">
              {formatCurrency(kpis.revenueThisMonth)} this month
              {kpis.revenueChange !== 0 && (
                <span className={kpis.revenueChange > 0 ? " text-teal-400" : " text-red-400"}>
                  {" "}{kpis.revenueChange > 0 ? "↑" : "↓"} {Math.abs(kpis.revenueChange)}% vs last month
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-accent rounded inline-block" /> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-teal-400 rounded inline-block" /> Tickets</span>
          </div>
        </div>
        <RevenueChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <h2 className="font-clash font-bold text-white">Recent Sales</h2>
            <Link href="/dashboard/attendees" className="text-xs text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-white/25 text-sm">No sales yet</div>
          ) : (
            <div className="divide-y divide-white/4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                    {(order.buyer.name ?? "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{order.buyer.name}</p>
                    <p className="text-xs text-white/35 truncate">
                      {order.event.title} · {order.orderItems[0]?.tier.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-accent">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-[10px] text-white/25">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <h2 className="font-clash font-bold text-white">Upcoming Events</h2>
            <Link href="/dashboard/events/new" className="text-xs text-accent hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> New
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-white/25 text-sm mb-3">No upcoming events</p>
              <Link href="/dashboard/events/new" className="text-xs text-accent hover:underline">
                Create your first event →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {upcomingEvents.map((event) => {
                const pct = event.totalCapacity > 0
                  ? Math.min((event.totalSold / event.totalCapacity) * 100, 100)
                  : 0;
                return (
                  <div key={event.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                        <p className="text-xs text-white/35">
                          {format(new Date(event.startAt), "MMM d, yyyy")}
                          {" · "}{EVENT_CATEGORY_LABELS[event.category]}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Link href={`/dashboard/checkin/${event.id}`}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-teal-500/12 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition-all">
                          <ScanLine className="w-3 h-3" /> Check-in
                        </Link>
                        <Link href={`/dashboard/events/${event.id}`}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white/6 border border-white/10 text-white/50 hover:text-white transition-all">
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct > 80 ? "#EF4444" : pct > 50 ? "#FFB800" : "#00D4AA",
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-white/30 whitespace-nowrap">
                        {event.totalSold}/{event.totalCapacity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
