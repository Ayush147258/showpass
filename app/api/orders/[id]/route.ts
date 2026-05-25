import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateQRDataUrl } from "@/lib/qr";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, email: true, image: true } },
        event: {
          include: {
            organiser: { select: { id: true, name: true } },
            ticketTiers: true,
          },
        },
        orderItems: { include: { tier: true } },
        tickets: {
          include: {
            tier: {
              include: {
                event: true,
              },
            },
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Only buyer or organiser or admin can see
    const isOwner = order.buyerId === session.user.id;
    const isOrganiser = order.event.organiserId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isOrganiser && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate QR data URLs for each ticket
    const ticketsWithQR = await Promise.all(
      order.tickets.map(async (ticket) => ({
        ...ticket,
        qrDataUrl: await generateQRDataUrl(ticket.qrCode),
      }))
    );

    return NextResponse.json({
      success: true,
      data: { ...order, tickets: ticketsWithQR },
    });
  } catch (err) {
    console.error("[Orders/GET]", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// PATCH /api/orders/[id] — request refund
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { reason } = await req.json();
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (order.status !== "PAID") {
      return NextResponse.json({ error: "Only paid orders can be refunded" }, { status: 400 });
    }

    const existing = await prisma.refundRequest.findFirst({ where: { orderId: id } });
    if (existing) {
      return NextResponse.json({ error: "Refund already requested" }, { status: 400 });
    }

    const refund = await prisma.refundRequest.create({
      data: { orderId: id, reason },
    });

    return NextResponse.json({ success: true, data: refund }, { status: 201 });
  } catch (err) {
    console.error("[Orders/PATCH]", err);
    return NextResponse.json({ error: "Failed to request refund" }, { status: 500 });
  }
}
