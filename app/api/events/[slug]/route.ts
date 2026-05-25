import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/events/[slug] — public event detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        organiser: {
          select: {
            id: true,
            name: true,
            image: true,
            organiserProfile: {
              select: { orgName: true, logoUrl: true, bio: true, website: true, isPro: true },
            },
          },
        },
        ticketTiers: { orderBy: { sortOrder: "asc" } },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        discountCodes: {
          where: { isActive: true },
          select: { code: true, type: true, value: true, expiresAt: true, maxUses: true, usedCount: true },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Non-published events only visible to organiser/admin
    if (!event.isPublished) {
      const isOwner = event.organiserId === userId;
      const isAdmin = session?.user?.role === "ADMIN";
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
    }

    // Check if user bookmarked
    let isBookmarked = false;
    if (userId) {
      const bm = await prisma.bookmark.findUnique({
        where: { userId_eventId: { userId, eventId: event.id } },
      });
      isBookmarked = !!bm;
    }

    // Avg rating
    const ratingAgg = await prisma.review.aggregate({
      where: { eventId: event.id },
      _avg: { rating: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        organiserProfile: event.organiser.organiserProfile,
        isBookmarked,
        avgRating: ratingAgg._avg.rating ?? 0,
        // Hide discount code details from public — only show if org is logged in
        discountCodes: event.organiserId === userId ? event.discountCodes : [],
      },
    });
  } catch (err) {
    console.error("[Events/Slug/GET]", err);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

const UpdateEventSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).optional(),
  bannerUrl: z.string().url().optional().nullable(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  venue: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
  address: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  isOnline: z.boolean().optional(),
  onlineUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

// PATCH /api/events/[slug] — update event (organiser/admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const isOwner = event.organiserId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Only admin can set isFeatured
    const body = await req.json();
    if (body.isFeatured !== undefined && !isAdmin) delete body.isFeatured;

    const data = UpdateEventSchema.parse(body);
    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        ...data,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    console.error("[Events/Slug/PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE /api/events/[slug] — soft delete (unpublish)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const isOwner = event.organiserId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.event.update({
      where: { id: event.id },
      data: { isPublished: false },
    });

    return NextResponse.json({ success: true, message: "Event unpublished" });
  } catch (err) {
    console.error("[Events/Slug/DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
