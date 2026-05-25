import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, organiserId: true, startAt: true, endAt: true },
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const isOwner = event.organiserId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [tiers, recentCheckIns] = await Promise.all([
      prisma.ticketTier.findMany({
        where: { eventId },
        select: {
          id: true, name: true, type: true, capacity: true, sold: true, price: true,
          _count: { select: { tickets: true } },
          tickets: { where: { isCheckedIn: true }, select: { id: true } },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.ticket.findMany({
        where: { tier: { eventId }, isCheckedIn: true },
        select: {
          id: true, attendeeName: true, attendeeEmail: true,
          checkedInAt: true, ticketRef: true,
          tier: { select: { name: true, type: true } },
        },
        orderBy: { checkedInAt: "desc" },
        take: 30,
      }),
    ]);

    const totalRegistered = tiers.reduce((s, t) => s + t._count.tickets, 0);
    const totalCheckedIn = tiers.reduce((s, t) => s + t.tickets.length, 0);

    const checkInTimeline = await prisma.checkIn.groupBy({
      by: ["scannedAt"],
      where: { ticket: { tier: { eventId } } },
      _count: { id: true },
      orderBy: { scannedAt: "asc" },
    });

    const hourlyBuckets = new Map<string, number>();
    for (const entry of checkInTimeline) {
      const hour = new Date(entry.scannedAt);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      hourlyBuckets.set(key, (hourlyBuckets.get(key) ?? 0) + entry._count.id);
    }

    const timeline = Array.from(hourlyBuckets.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return NextResponse.json({
      success: true,
      data: {
        eventId: event.id, eventTitle: event.title,
        startAt: event.startAt, endAt: event.endAt,
        totalRegistered, totalCheckedIn,
        checkInRate: totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0,
        byTier: tiers.map((t) => ({
          tierId: t.id, tierName: t.name, tierType: t.type,
          capacity: t.capacity, sold: t.sold,
          registered: t._count.tickets, checkedIn: t.tickets.length,
          revenue: t.sold * t.price,
        })),
        recentCheckIns: recentCheckIns.map((t) => ({
          id: t.id, attendeeName: t.attendeeName, attendeeEmail: t.attendeeEmail,
          tierName: t.tier.name, tierType: t.tier.type,
          ticketRef: t.ticketRef, checkedInAt: t.checkedInAt,
        })),
        timeline,
      },
    });
  } catch (err) {
    console.error("[Organiser/CheckinStats]", err);
    return NextResponse.json({ error: "Failed to fetch check-in stats" }, { status: 500 });
  }
}
