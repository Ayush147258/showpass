import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // published | unpublished | featured
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  try {
    const where: Record<string, unknown> = {};
    if (status === "published") where.isPublished = true;
    if (status === "unpublished") where.isPublished = false;
    if (status === "featured") where.isFeatured = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { organiser: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [events, total, stats] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organiser: { select: { id: true, name: true, email: true } },
          ticketTiers: { select: { capacity: true, sold: true, price: true } },
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
      // Platform-wide stats
      Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { isPublished: true } }),
        prisma.event.count({ where: { isFeatured: true } }),
        prisma.order.aggregate({
          where: { status: "PAID" },
          _sum: { totalAmount: true, platformFee: true },
          _count: { id: true },
        }),
        prisma.user.count(),
        prisma.ticket.count({ where: { order: { status: "PAID" } } }),
      ]),
    ]);

    const [totalEvents, publishedEvents, featuredEvents, revenueAgg, totalUsers, totalTickets] = stats;

    return NextResponse.json({
      success: true,
      data: events.map((e) => ({
        ...e,
        totalRevenue: e.ticketTiers.reduce((s, t) => s + t.sold * t.price, 0),
        totalSold: e.ticketTiers.reduce((s, t) => s + t.sold, 0),
        totalCapacity: e.ticketTiers.reduce((s, t) => s + t.capacity, 0),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
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
    });
  } catch (err) {
    console.error("[Admin/Events/LIST]", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
