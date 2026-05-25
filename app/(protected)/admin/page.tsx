import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventApprovalTable } from "@/components/admin/EventApprovalTable";
import { RefundManager } from "@/components/admin/RefundManager";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck, Ticket, IndianRupee, Users,
  BarChart3, AlertTriangle,
} from "lucide-react";

async function getAdminData() {
  const [eventsData, refundsData] = await Promise.all([
    fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/admin/events?limit=50`).then((r) => r.json()).catch(() => null),
    fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/admin/refunds?status=PENDING`).then((r) => r.json()).catch(() => null),
  ]);

  // Direct Prisma for reliability in SSR
  const [allEvents, pendingRefunds, stats] = await Promise.all([
    prisma.event.findMany({
      include: {
        organiser: { select: { name: true, email: true } },
        ticketTiers: { select: { capacity: true, sold: true, price: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.refundRequest.findMany({
      include: {
        order: {
          include: {
            buyer: { select: { name: true, email: true } },
            event: { select: { title: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { isPublished: true } }),
      prisma.event.count({ where: { isFeatured: true } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { totalAmount: true, platformFee: true }, _count: { id: true } }),
      prisma.user.count(),
      prisma.ticket.count({ where: { order: { status: "PAID" } } }),
      prisma.refundRequest.count({ where: { status: "PENDING" } }),
    ]),
  ]);

  const [totalEvents, publishedEvents, featuredEvents, revenueAgg, totalUsers, totalTickets, pendingRefundCount] = stats;

  return {
    events: allEvents.map((e) => ({
      ...e,
      totalRevenue: e.ticketTiers.reduce((s, t) => s + t.sold * t.price, 0),
      totalSold: e.ticketTiers.reduce((s, t) => s + t.sold, 0),
      totalCapacity: e.ticketTiers.reduce((s, t) => s + t.capacity, 0),
    })),
    refunds: pendingRefunds,
    platformStats: {
      totalEvents,
      publishedEvents,
      featuredEvents,
      totalRevenue: revenueAgg._sum.totalAmount ?? 0,
      platformEarnings: revenueAgg._sum.platformFee ?? 0,
      totalOrders: revenueAgg._count.id,
      totalUsers,
      totalTickets,
    },
    pendingRefundCount,
  };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const { events, refunds, platformStats, pendingRefundCount } = await getAdminData();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-red-400" />
            <h1 className="font-clash text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-white/40 text-sm">Platform management · SHOWPASS</p>
        </div>
        {pendingRefundCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/12 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {pendingRefundCount} pending refund{pendingRefundCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: BarChart3, label: "Total Events", value: String(platformStats.totalEvents), color: "text-white" },
          { icon: Ticket, label: "Published", value: String(platformStats.publishedEvents), color: "text-teal-400" },
          { icon: IndianRupee, label: "Gross Revenue", value: formatCurrency(platformStats.totalRevenue), color: "text-accent" },
          { icon: IndianRupee, label: "Platform Earnings", value: formatCurrency(platformStats.platformEarnings), color: "text-gold-500" },
          { icon: Users, label: "Total Users", value: platformStats.totalUsers.toLocaleString("en-IN"), color: "text-purple-400" },
          { icon: Ticket, label: "Tickets Issued", value: platformStats.totalTickets.toLocaleString("en-IN"), color: "text-blue-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <Icon className={`w-4 h-4 ${color} mb-2 opacity-70`} />
            <p className={`font-clash font-bold text-lg ${color}`}>{value}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Events section */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 bg-accent rounded-full" />
          <h2 className="font-clash text-xl font-bold text-white">Event Management</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/40 font-semibold">
            {events.length} events
          </span>
        </div>
        <EventApprovalTable
          initialEvents={events as any}
          platformStats={platformStats}
        />
      </section>

      {/* Refunds section */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 bg-red-400 rounded-full" />
          <h2 className="font-clash text-xl font-bold text-white">Refund Requests</h2>
          {pendingRefundCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-semibold">
              {pendingRefundCount} pending
            </span>
          )}
        </div>
        <RefundManager
          initialRefunds={refunds as any}
          pendingCount={pendingRefundCount}
        />
      </section>
    </div>
  );
}
