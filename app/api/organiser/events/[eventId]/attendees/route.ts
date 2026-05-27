import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const { searchParams } = new URL(req.url);
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

    const checkedIn = searchParams.get("checkedIn");
    const format = searchParams.get("format");
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1), 100);
    const where = {
      tier: { eventId },
      order: { status: "PAID" as const },
      ...(checkedIn === "true" ? { isCheckedIn: true } : {}),
      ...(checkedIn === "false" ? { isCheckedIn: false } : {}),
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        select: {
          id: true,
          ticketRef: true,
          attendeeName: true,
          attendeeEmail: true,
          isCheckedIn: true,
          checkedInAt: true,
          createdAt: true,
          tier: { select: { name: true, type: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
        ...(format === "csv" ? {} : { skip: (page - 1) * limit, take: limit }),
      }),
      prisma.ticket.count({ where }),
    ]);

    const attendees = tickets.map((ticket) => ({
      id: ticket.id,
      ticketRef: ticket.ticketRef,
      attendeeName: ticket.attendeeName,
      attendeeEmail: ticket.attendeeEmail,
      tierName: ticket.tier.name,
      tierType: ticket.tier.type,
      price: ticket.tier.price,
      purchasedAt: ticket.createdAt,
      isCheckedIn: ticket.isCheckedIn,
      checkedInAt: ticket.checkedInAt,
      eventTitle: event.title,
    }));

    if (format === "csv") {
      const header = ["Ticket Ref", "Name", "Email", "Tier", "Type", "Price", "Purchased At", "Checked In", "Checked In At"];
      const rows = attendees.map((a) => [
        a.ticketRef,
        a.attendeeName,
        a.attendeeEmail,
        a.tierName,
        a.tierType,
        String(a.price),
        new Date(a.purchasedAt).toISOString(),
        a.isCheckedIn ? "Yes" : "No",
        a.checkedInAt ? new Date(a.checkedInAt).toISOString() : "",
      ]);
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attendees.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: attendees,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[Organiser/Attendees]", err);
    return NextResponse.json({ error: "Failed to fetch attendees" }, { status: 500 });
  }
}
