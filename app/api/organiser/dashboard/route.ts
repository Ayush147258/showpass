import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { subDays, startOfDay, format, eachDayOfInterval } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ORGANISER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Organiser access required" }, { status: 403 });
  }

  try {
    const organiserId = session.user.id;
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // ── Core aggregates (parallel) ──────────────────────────────────
    const [
      allEvents,
      totalRevenueAgg,
      revenueThisMonthAgg,
      revenueLastMonthAgg,
      totalTicketsSold,
      checkinStats,
      topEvent,
      recentOrders,
      categoryBreakdown,
    ] = await Promise.all([
      // All events for this organiser
      prisma.event.findMany({
        where: { organiserId },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          startAt: true,
          endAt: true,
          isPublished: true,
          bannerUrl: true,
          ticketTiers: {
            select: { capacity: true, sold: true, price: true, type: true },
          },
        },
        orderBy: { startAt: "desc" },
      }),

      // All-time revenue
      prisma.order.aggregate({
        where: { event: { organiserId }, status: "PAID" },
        _sum: { totalAmount: true, platformFee: true },
        _count: { id: true },
      }),

      // Revenue this month (last 30 days)
      prisma.order.aggregate({
        where: {
          event: { organiserId },
          status: "PAID",
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalAmount: true },
      }),

      // Revenue last month (30–60 days ago)
      prisma.order.aggregate({
        where: {
          event: { organiserId },
          status: "PAID",
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        _sum: { totalAmount: true },
      }),

      // Total tickets sold
      prisma.ticket.count({
        where: { tier: { event: { organiserId } }, order: { status: "PAID" } },
      }),

      // Check-in stats
      prisma.ticket.aggregate({
        where: { tier: { event: { organiserId } }, order: { status: "PAID" } },
        _count: { id: true },
      }),

      // Top revenue event
      prisma.order.groupBy({
        by: ["eventId"],
        where: { event: { organiserId }, status: "PAID" },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 1,
      }),

      // Recent orders
      prisma.order.findMany({
        where: { event: { organiserId }, status: "PAID" },
        include: {
          buyer: { select: { name: true, email: true, image: true } },
          event: { select: { title: true, slug: true } },
          orderItems: {
            include: { tier: { select: { name: true, type: true } } },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),

      // Category breakdown
      prisma.event.groupBy({
        by: ["category"],
        where: { organiserId },
        _count: { id: true },
      }),
    ]);

    // ── Checked-in count ────────────────────────────────────────────
    const checkedInCount = await prisma.ticket.count({
      where: {
        tier: { event: { organiserId } },
        order: { status: "PAID" },
        isCheckedIn: true,
      },
    });

    const checkInRate =
      checkinStats._count.id > 0
        ? Math.round((checkedInCount / checkinStats._count.id) * 100)
        : 0;

    // ── Revenue change % ────────────────────────────────────────────
    const thisMonth = revenueThisMonthAgg._sum.totalAmount ?? 0;
    const lastMonth = revenueLastMonthAgg._sum.totalAmount ?? 0;
    const revenueChange =
      lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    // ── Top event title ─────────────────────────────────────────────
    let topEventData = null;
    if (topEvent[0]) {
      const ev = allEvents.find((e) => e.id === topEvent[0].eventId);
      topEventData = ev
        ? { title: ev.title, revenue: topEvent[0]._sum.totalAmount ?? 0 }
        : null;
    }

    // ── Revenue chart — last 30 days ────────────────────────────────
    const dailyRevenue = await prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        event: { organiserId },
        status: "PAID",
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // Build full 30-day array with zeroes for missing days
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    const revenueByDay = new Map<string, { revenue: number; tickets: number }>();

    for (const order of dailyRevenue) {
      const key = format(new Date(order.createdAt), "MMM d");
      const existing = revenueByDay.get(key) ?? { revenue: 0, tickets: 0 };
      existing.revenue += order._sum.totalAmount ?? 0;
      existing.tickets += order._count.id;
      revenueByDay.set(key, existing);
    }

    // Also get ticket counts per day
    const dailyTickets = await prisma.ticket.groupBy({
      by: ["createdAt"],
      where: {
        tier: { event: { organiserId } },
        order: { status: "PAID", createdAt: { gte: thirtyDaysAgo } },
      },
      _count: { id: true },
    });

    const ticketsByDay = new Map<string, number>();
    for (const t of dailyTickets) {
      const key = format(new Date(t.createdAt), "MMM d");
      ticketsByDay.set(key, (ticketsByDay.get(key) ?? 0) + t._count.id);
    }

    const chartData = days.map((day) => {
      const key = format(day, "MMM d");
      const rv = revenueByDay.get(key);
      return {
        date: format(day, "MMM d"),
        revenue: rv?.revenue ?? 0,
        tickets: ticketsByDay.get(key) ?? 0,
      };
    });

    // ── Upcoming events ─────────────────────────────────────────────
    const upcomingEvents = allEvents
      .filter((e) => e.startAt > now && e.isPublished)
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        startAt: e.startAt,
        category: e.category,
        bannerUrl: e.bannerUrl,
        totalCapacity: e.ticketTiers.reduce((s, t) => s + t.capacity, 0),
        totalSold: e.ticketTiers.reduce((s, t) => s + t.sold, 0),
        revenue: e.ticketTiers.reduce((s, t) => s + t.sold * t.price, 0),
      }));

    // ── Tier type breakdown ─────────────────────────────────────────
    const tierBreakdown = await prisma.orderItem.groupBy({
      by: ["tierId"],
      where: { order: { event: { organiserId }, status: "PAID" } },
      _sum: { quantity: true },
    });

    const tierDetails = await prisma.ticketTier.findMany({
      where: { id: { in: tierBreakdown.map((t) => t.tierId) } },
      select: { id: true, type: true, name: true },
    });

    const tierMap = new Map(tierDetails.map((t) => [t.id, t]));
    const tierSales = tierBreakdown.reduce(
      (acc, t) => {
        const tier = tierMap.get(t.tierId);
        if (!tier) return acc;
        acc[tier.type] = (acc[tier.type] ?? 0) + (t._sum.quantity ?? 0);
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalRevenue: totalRevenueAgg._sum.totalAmount ?? 0,
          netRevenue:
            (totalRevenueAgg._sum.totalAmount ?? 0) -
            (totalRevenueAgg._sum.platformFee ?? 0),
          totalOrders: totalRevenueAgg._count.id,
          totalTicketsSold,
          revenueThisMonth: thisMonth,
          revenueLastMonth: lastMonth,
          revenueChange: Math.round(revenueChange * 10) / 10,
          totalEvents: allEvents.length,
          publishedEvents: allEvents.filter((e) => e.isPublished).length,
          upcomingEventsCount: upcomingEvents.length,
          checkInRate,
          topEvent: topEventData,
        },
        chartData,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          buyerName: o.buyer.name,
          buyerEmail: o.buyer.email,
          buyerImage: o.buyer.image,
          eventTitle: o.event.title,
          eventSlug: o.event.slug,
          tierName: o.orderItems[0]?.tier.name ?? "Ticket",
          tierType: o.orderItems[0]?.tier.type ?? "GENERAL",
          amount: o.totalAmount,
          createdAt: o.createdAt,
        })),
        upcomingEvents,
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
        tierSales,
      },
    });
  } catch (err) {
    console.error("[Organiser/Dashboard]", err);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
