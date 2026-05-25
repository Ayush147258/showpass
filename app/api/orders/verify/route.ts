import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQRToken, generateTicketRef } from "@/lib/qr";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Fetch order with items + event
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { tier: true } },
        event: true,
        buyer: true,
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status === "PAID") {
      return NextResponse.json({ success: true, data: { orderId, alreadyPaid: true } });
    }

    // Generate tickets + mark order paid in one transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", paymentId: razorpay_payment_id, paymentProvider: "razorpay" },
      });

      const ticketData: {
        orderId: string; tierId: string; attendeeName: string;
        attendeeEmail: string; qrCode: string; ticketRef: string;
      }[] = [];

      for (const item of order.orderItems) {
        for (let i = 0; i < item.quantity; i++) {
          const ticketRef = generateTicketRef(order.event.slug);
          const qrToken = await generateQRToken({
            ticketId: ticketRef,
            eventId: order.eventId,
            tierId: item.tierId,
            attendeeEmail: order.buyer.email!,
            issuedAt: Date.now(),
          });
          ticketData.push({
            orderId: order.id,
            tierId: item.tierId,
            attendeeName: order.buyer.name ?? "Attendee",
            attendeeEmail: order.buyer.email!,
            qrCode: qrToken,
            ticketRef,
          });
        }
      }

      await tx.ticket.createMany({ data: ticketData });

      // Update discount code usage if applicable
      if (order.discountCode) {
        await tx.discountCode.updateMany({
          where: { eventId: order.eventId, code: order.discountCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Create confirmation notification
      await tx.notification.create({
        data: {
          userId: order.buyerId,
          type: "TICKET_CONFIRMED",
          title: `Tickets confirmed: ${order.event.title}`,
          body: `${ticketData.length} ticket(s) ready. See you there!`,
          metadata: { orderId: order.id, eventId: order.eventId },
        },
      });
    });

    return NextResponse.json({ success: true, data: { orderId, ticketsGenerated: true } });
  } catch (err) {
    console.error("[Orders/Verify]", err);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
