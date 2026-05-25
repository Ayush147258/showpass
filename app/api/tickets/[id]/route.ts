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
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        tier: {
          include: {
            event: {
              include: {
                organiser: { select: { id: true, name: true, image: true } },
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            buyerId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // Only owner, event organiser, or admin
    const isOwner = ticket.order.buyerId === session.user.id;
    const isOrganiser = ticket.tier.event.organiserId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isOrganiser && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const qrDataUrl = await generateQRDataUrl(ticket.qrCode);

    return NextResponse.json({
      success: true,
      data: { ...ticket, qrDataUrl },
    });
  } catch (err) {
    console.error("[Tickets/GET]", err);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}
