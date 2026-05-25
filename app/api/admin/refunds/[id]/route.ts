import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const RefundActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

// GET /api/admin/refunds/[id] — single refund detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const refund = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, email: true, image: true } },
            event: { select: { id: true, title: true, slug: true, startAt: true } },
            orderItems: { include: { tier: { select: { name: true, type: true } } } },
            tickets: { select: { id: true, ticketRef: true, isCheckedIn: true } },
          },
        },
      },
    });

    if (!refund) return NextResponse.json({ error: "Refund request not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: refund });
  } catch (err) {
    console.error("[Admin/Refunds/GET]", err);
    return NextResponse.json({ error: "Failed to fetch refund" }, { status: 500 });
  }
}

// PATCH /api/admin/refunds/[id] — approve or reject
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = RefundActionSchema.parse(await req.json());

    const refund = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true } },
            event: { select: { title: true } },
            tickets: { select: { id: true } },
          },
        },
      },
    });

    if (!refund) return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    if (refund.status !== "PENDING") {
      return NextResponse.json(
        { error: `Refund already ${refund.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const isApprove = body.action === "approve";

    await prisma.$transaction(async (tx) => {
      // Update refund status
      await tx.refundRequest.update({
        where: { id },
        data: {
          status: isApprove ? "APPROVED" : "REJECTED",
          processedAt: new Date(),
          processedBy: session.user.id,
        },
      });

      if (isApprove) {
        // Mark order as refunded
        await tx.order.update({
          where: { id: refund.orderId },
          data: { status: "REFUNDED" },
        });

        // Invalidate all tickets for this order
        await tx.ticket.updateMany({
          where: { orderId: refund.orderId },
          data: { isCheckedIn: false },
        });

        // Restore sold counts on tiers
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: refund.orderId },
        });
        for (const item of orderItems) {
          await tx.ticketTier.update({
            where: { id: item.tierId },
            data: { sold: { decrement: item.quantity } },
          });
        }

        // Notify buyer — approved
        await tx.notification.create({
          data: {
            userId: refund.order.buyer.id,
            type: "REFUND_APPROVED",
            title: "Refund approved ✅",
            body: `Your refund for "${refund.order.event.title}" has been approved. Amount will be credited within 5–7 business days.`,
            metadata: { orderId: refund.orderId, refundId: id },
          },
        });
      } else {
        // Notify buyer — rejected
        await tx.notification.create({
          data: {
            userId: refund.order.buyer.id,
            type: "REFUND_REJECTED",
            title: "Refund request declined",
            body:
              body.reason ??
              `Your refund request for "${refund.order.event.title}" could not be approved. Contact support for help.`,
            metadata: { orderId: refund.orderId, refundId: id },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        status: isApprove ? "APPROVED" : "REJECTED",
        processedAt: new Date(),
        processedBy: session.user.id,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    console.error("[Admin/Refunds/PATCH]", err);
    return NextResponse.json({ error: "Refund action failed" }, { status: 500 });
  }
}

// GET /api/admin/refunds — list all pending refunds (no [id])
// Accessed at /api/admin/refunds — see route.ts in that folder
