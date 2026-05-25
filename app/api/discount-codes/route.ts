import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// POST /api/discount-codes — validate a code at checkout (public-ish, needs eventId)
export async function POST(req: NextRequest) {
  try {
    const { eventId, code, subtotal } = await req.json();
    if (!eventId || !code) {
      return NextResponse.json({ error: "eventId and code required" }, { status: 400 });
    }

    const dc = await prisma.discountCode.findUnique({
      where: { eventId_code: { eventId, code: code.toUpperCase().trim() } },
    });

    if (!dc || !dc.isActive) {
      return NextResponse.json({ valid: false, message: "Invalid discount code" });
    }
    if (dc.expiresAt && dc.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, message: "Discount code has expired" });
    }
    if (dc.usedCount >= dc.maxUses) {
      return NextResponse.json({ valid: false, message: "Discount code is fully redeemed" });
    }

    const discountAmount =
      dc.type === "PERCENT"
        ? (subtotal ?? 0) * (dc.value / 100)
        : Math.min(dc.value, subtotal ?? dc.value);

    return NextResponse.json({
      valid: true,
      code: dc.code,
      type: dc.type,
      value: dc.value,
      discountAmount: Math.round(discountAmount * 100) / 100,
      message: dc.type === "PERCENT" ? `${dc.value}% off applied!` : `₹${dc.value} off applied!`,
    });
  } catch (err) {
    console.error("[DiscountCodes/POST]", err);
    return NextResponse.json({ error: "Failed to validate code" }, { status: 500 });
  }
}

const CreateCodeSchema = z.object({
  eventId: z.string(),
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(["PERCENT", "FLAT"]).default("PERCENT"),
  value: z.number().positive(),
  maxUses: z.number().int().positive().default(100),
  expiresAt: z.string().datetime().optional(),
});

// PUT /api/discount-codes — create a new code (organiser only)
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = CreateCodeSchema.parse(await req.json());

    // Verify organiser owns this event
    const event = await prisma.event.findUnique({ where: { id: body.eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (event.organiserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const code = await prisma.discountCode.create({
      data: {
        eventId: body.eventId,
        code: body.code,
        type: body.type,
        value: body.value,
        maxUses: body.maxUses,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return NextResponse.json({ success: true, data: code }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    console.error("[DiscountCodes/PUT]", err);
    return NextResponse.json({ error: "Failed to create code" }, { status: 500 });
  }
}

// GET /api/discount-codes?eventId=xxx — list codes for an event (organiser)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = new URL(req.url).searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (event.organiserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const codes = await prisma.discountCode.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: codes });
  } catch (err) {
    console.error("[DiscountCodes/GET]", err);
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}

// DELETE /api/discount-codes?id=xxx — deactivate a code
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const code = await prisma.discountCode.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!code) return NextResponse.json({ error: "Code not found" }, { status: 404 });
    if (code.event.organiserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.discountCode.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DiscountCodes/DELETE]", err);
    return NextResponse.json({ error: "Failed to deactivate code" }, { status: 500 });
  }
}
