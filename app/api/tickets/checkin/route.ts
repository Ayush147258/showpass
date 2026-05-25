import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyQRToken } from "@/lib/qr";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ORGANISER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only organisers can check in attendees" }, { status: 403 });
  }

  try {
    const { qrToken, eventId } = await req.json();
    if (!qrToken) return NextResponse.json({ error: "QR token required" }, { status: 400 });

    // Verify JWT signature
    const payload = await verifyQRToken(qrToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "INVALID_QR", message: "Invalid or tampered QR code" },
        { status: 400 }
      );
    }

    // Validate event matches
    if (eventId && payload.eventId !== eventId) {
      return NextResponse.json(
        { success: false, error: "WRONG_EVENT", message: "Ticket is for a different event" },
        { status: 400 }
      );
    }

    // Find the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { qrCode: qrToken },
      include: {
        tier: { include: { event: true } },
        order: { select: { status: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Verify order is paid
    if (ticket.order.status !== "PAID") {
      return NextResponse.json(
        { success: false, error: "UNPAID", message: "Ticket payment not confirmed" },
        { status: 400 }
      );
    }

    // Idempotent: already checked in
    if (ticket.isCheckedIn) {
      return NextResponse.json({
        success: false,
        error: "ALREADY_CHECKED_IN",
        message: "This ticket was already scanned",
        ticket: {
          id: ticket.id,
          attendeeName: ticket.attendeeName,
          tierName: ticket.tier.name,
          checkedInAt: ticket.checkedInAt,
        },
      });
    }

    // Mark as checked in + log
    const [updatedTicket] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { isCheckedIn: true, checkedInAt: new Date() },
      }),
      prisma.checkIn.create({
        data: {
          ticketId: ticket.id,
          scannedBy: session.user.id,
          deviceInfo: req.headers.get("user-agent") ?? undefined,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        tierName: ticket.tier.name,
        tierType: ticket.tier.type,
        eventTitle: ticket.tier.event.title,
        ticketRef: ticket.ticketRef,
        checkedInAt: updatedTicket.checkedInAt,
      },
    });
  } catch (err) {
    console.error("[Tickets/CheckIn]", err);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}

// GET — fetch live check-in stats for an event
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = new URL(req.url).searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  try {
    const [registered, checkedIn, byTier, recent] = await Promise.all([
      prisma.ticket.count({ where: { tier: { eventId } } }),
      prisma.ticket.count({ where: { tier: { eventId }, isCheckedIn: true } }),
      prisma.ticketTier.findMany({
        where: { eventId },
        select: {
          name: true,
          type: true,
          _count: { select: { tickets: true } },
          tickets: { where: { isCheckedIn: true }, select: { id: true } },
        },
      }),
      prisma.ticket.findMany({
        where: { tier: { eventId }, isCheckedIn: true },
        orderBy: { checkedInAt: "desc" },
        take: 20,
        select: {
          attendeeName: true,
          checkedInAt: true,
          tier: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        registered,
        checkedIn,
        byTier: byTier.map((t) => ({
          tierName: t.name,
          registered: t._count.tickets,
          checkedIn: t.tickets.length,
        })),
        recentCheckIns: recent.map((t) => ({
          attendeeName: t.attendeeName,
          tierName: t.tier.name,
          checkedInAt: t.checkedInAt,
        })),
      },
    });
  } catch (err) {
    console.error("[Tickets/CheckIn/GET]", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
