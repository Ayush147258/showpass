import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateQRToken, generateTicketRef } from "@/lib/qr";
import { calculatePlatformFee } from "@/lib/utils";
import { z } from "zod";

const OrderSchema = z.object({
  eventId: z.string(),
  items: z.array(z.object({
    tierId: z.string(),
    quantity: z.number().min(1).max(10),
    attendees: z.array(z.object({
      name: z.string().min(2),
      email: z.string().email(),
    })).optional(),
  })).min(1),
  discountCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to purchase tickets" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { eventId, items, discountCode } = OrderSchema.parse(body);

    // Fetch event + tiers
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTiers: true },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (!event.isPublished) return NextResponse.json({ error: "Event is not available" }, { status: 400 });

    // Validate tiers + availability
    const tierMap = new Map(event.ticketTiers.map((t) => [t.id, t]));
    let subtotal = 0;

    for (const item of items) {
      const tier = tierMap.get(item.tierId);
      if (!tier) return NextResponse.json({ error: `Tier not found: ${item.tierId}` }, { status: 400 });
      const available = tier.capacity - tier.sold;
      if (available < item.quantity) {
        return NextResponse.json({ error: `Only ${available} ticket(s) left for "${tier.name}"` }, { status: 400 });
      }
      // Use early bird price if applicable
      const now = new Date();
      const price = (tier.earlyBirdPrice && tier.earlyBirdEndsAt && now < tier.earlyBirdEndsAt)
        ? tier.earlyBirdPrice
        : tier.price;
      subtotal += price * item.quantity;
    }

    // Validate discount code
    let discountAmount = 0;
    if (discountCode) {
      const code = await prisma.discountCode.findUnique({
        where: { eventId_code: { eventId, code: discountCode } },
      });
      if (code && code.isActive && (!code.expiresAt || code.expiresAt > new Date()) && code.usedCount < code.maxUses) {
        discountAmount = code.type === "PERCENT"
          ? subtotal * (code.value / 100)
          : Math.min(code.value, subtotal);
      }
    }

    const totalAmount = Math.max(subtotal - discountAmount, 0);
    const platformFee = calculatePlatformFee(totalAmount);

    // Create order + items atomically
    const order = await prisma.$transaction(async (tx) => {
      // Re-check availability inside transaction
      for (const item of items) {
        const tier = await tx.ticketTier.findUnique({ where: { id: item.tierId } });
        if (!tier || (tier.capacity - tier.sold) < item.quantity) {
          throw new Error(`Seats no longer available for tier: ${item.tierId}`);
        }
      }

      const newOrder = await tx.order.create({
        data: {
          buyerId: session.user.id,
          eventId,
          totalAmount,
          platformFee,
          status: totalAmount === 0 ? "PAID" : "PENDING",
          discountCode: discountCode || null,
          discountAmount,
          orderItems: {
            create: items.map((item) => {
              const tier = tierMap.get(item.tierId)!;
              const now = new Date();
              const price = (tier.earlyBirdPrice && tier.earlyBirdEndsAt && now < tier.earlyBirdEndsAt)
                ? tier.earlyBirdPrice : tier.price;
              return { tierId: item.tierId, quantity: item.quantity, unitPrice: price };
            }),
          },
        },
      });

      // Update sold counts
      for (const item of items) {
        await tx.ticketTier.update({
          where: { id: item.tierId },
          data: { sold: { increment: item.quantity } },
        });
      }

      const tickets = [];
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          const attendee = item.attendees?.[i];
          const ticketRef = generateTicketRef(event.slug);
          const attendeeEmail = attendee?.email ?? session.user.email!;
          const qrToken = await generateQRToken({
            ticketId: ticketRef,
            eventId,
            tierId: item.tierId,
            attendeeEmail,
            issuedAt: Date.now(),
          });
          tickets.push({
            orderId: newOrder.id,
            tierId: item.tierId,
            attendeeName: attendee?.name ?? session.user.name ?? "Attendee",
            attendeeEmail,
            qrCode: qrToken,
            ticketRef,
          });
        }
      }
      await tx.ticket.createMany({ data: tickets });

      if (totalAmount === 0) {
        // Update discount code usage
        if (discountCode) {
          await tx.discountCode.update({
            where: { eventId_code: { eventId, code: discountCode } },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      return newOrder;
    });

    // For paid orders, create Razorpay order
    if (totalAmount > 0) {
      const razorpayOrder = await createRazorpayOrder(order.id, totalAmount);
      return NextResponse.json({
        success: true,
        data: { orderId: order.id, razorpayOrderId: razorpayOrder.id, amount: totalAmount, currency: "INR" },
      });
    }

    return NextResponse.json({ success: true, data: { orderId: order.id, status: "PAID" } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: err.issues }, { status: 400 });
    }
    console.error("[Orders POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Order failed" }, { status: 500 });
  }
}

async function createRazorpayOrder(orderId: string, amount: number) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: orderId,
      notes: { orderId },
    }),
  });
  if (!res.ok) throw new Error("Razorpay order creation failed");
  return res.json();
}
