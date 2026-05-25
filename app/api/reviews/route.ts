import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const ReviewSchema = z.object({
  eventId: z.string(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
});

// GET /api/reviews?eventId=xxx — list reviews for an event
export async function GET(req: NextRequest) {
  const eventId = new URL(req.url).searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  try {
    const [reviews, agg] = await Promise.all([
      prisma.review.findMany({
        where: { eventId },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.review.aggregate({
        where: { eventId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Distribution
    const dist = await prisma.review.groupBy({
      by: ["rating"],
      where: { eventId },
      _count: { rating: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        avgRating: agg._avg.rating ?? 0,
        totalReviews: agg._count.rating,
        distribution: [5, 4, 3, 2, 1].map((r) => ({
          rating: r,
          count: dist.find((d) => d.rating === r)?._count.rating ?? 0,
        })),
      },
    });
  } catch (err) {
    console.error("[Reviews/GET]", err);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews — submit a review (must have attended)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = ReviewSchema.parse(await req.json());

    // Verify user attended (has a checked-in ticket)
    const attended = await prisma.ticket.findFirst({
      where: {
        tier: { eventId: body.eventId },
        order: { buyerId: session.user.id, status: "PAID" },
        isCheckedIn: true,
      },
    });

    if (!attended) {
      return NextResponse.json(
        { error: "You must attend the event before leaving a review" },
        { status: 403 }
      );
    }

    // Upsert — one review per user per event
    const review = await prisma.review.upsert({
      where: { userId_eventId: { userId: session.user.id, eventId: body.eventId } },
      update: { rating: body.rating, body: body.body },
      create: { userId: session.user.id, eventId: body.eventId, rating: body.rating, body: body.body },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    console.error("[Reviews/POST]", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

// DELETE /api/reviews?eventId=xxx — delete own review
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = new URL(req.url).searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  try {
    await prisma.review.deleteMany({
      where: { userId: session.user.id, eventId },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Reviews/DELETE]", err);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
