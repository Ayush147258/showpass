import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const AdminEventSchema = z.object({
  action: z.enum(["approve", "reject", "feature", "unfeature", "unpublish"]),
  reason: z.string().optional(),
});

// PATCH /api/admin/events/[id] — approve/reject/feature
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
    const body = AdminEventSchema.parse(await req.json());

    const event = await prisma.event.findUnique({
      where: { id },
      include: { organiser: { select: { id: true, name: true, email: true } } },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    let updateData: Record<string, unknown> = {};
    let notificationTitle = "";
    let notificationBody = "";

    switch (body.action) {
      case "approve":
        updateData = { isPublished: true };
        notificationTitle = `Event approved: ${event.title}`;
        notificationBody = "Your event is now live on SHOWPASS. Start promoting!";
        break;
      case "reject":
        updateData = { isPublished: false };
        notificationTitle = `Event needs changes: ${event.title}`;
        notificationBody = body.reason ?? "Please review and resubmit your event.";
        break;
      case "feature":
        updateData = { isFeatured: true, isPublished: true };
        notificationTitle = `🌟 Event featured: ${event.title}`;
        notificationBody = "Congratulations! Your event is now featured on the SHOWPASS homepage.";
        break;
      case "unfeature":
        updateData = { isFeatured: false };
        notificationTitle = `Event unfeatured: ${event.title}`;
        notificationBody = "Your event has been removed from the featured section.";
        break;
      case "unpublish":
        updateData = { isPublished: false, isFeatured: false };
        notificationTitle = `Event unpublished: ${event.title}`;
        notificationBody = body.reason ?? "Your event has been temporarily unpublished.";
        break;
    }

    const [updatedEvent] = await prisma.$transaction([
      prisma.event.update({ where: { id }, data: updateData }),
      prisma.notification.create({
        data: {
          userId: event.organiser.id,
          type: body.action === "approve" || body.action === "feature"
            ? "TICKET_CONFIRMED"
            : "EVENT_CANCELLED",
          title: notificationTitle,
          body: notificationBody,
          metadata: { eventId: id, action: body.action },
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    console.error("[Admin/Events/PATCH]", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

// GET /api/admin/events/[id] — full event detail for review
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
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organiser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            organiserProfile: true,
          },
        },
        ticketTiers: true,
        _count: { select: { reviews: true } },
      },
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Revenue for this event
    const revenue = await prisma.order.aggregate({
      where: { eventId: id, status: "PAID" },
      _sum: { totalAmount: true, platformFee: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        organiserProfile: event.organiser.organiserProfile,
        revenue: revenue._sum.totalAmount ?? 0,
        platformFee: revenue._sum.platformFee ?? 0,
        totalOrders: revenue._count.id,
      },
    });
  } catch (err) {
    console.error("[Admin/Events/GET]", err);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

// GET /api/admin/events — list all events with filters (no [id])
// This is accessed at /api/admin/events directly — see separate route file
