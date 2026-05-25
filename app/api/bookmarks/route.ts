import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET — fetch all bookmarked events for logged-in user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        event: {
          include: {
            organiser: { select: { id: true, name: true, image: true } },
            ticketTiers: { orderBy: { sortOrder: "asc" } },
            _count: { select: { reviews: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: bookmarks.map((b) => ({ ...b.event, isBookmarked: true })),
    });
  } catch (err) {
    console.error("[Bookmarks/GET]", err);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

// POST — toggle bookmark for an event
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { eventId } = await req.json();
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

    const existing = await prisma.bookmark.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId } },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { userId_eventId: { userId: session.user.id, eventId } },
      });
      return NextResponse.json({ success: true, bookmarked: false });
    }

    await prisma.bookmark.create({
      data: { userId: session.user.id, eventId },
    });

    return NextResponse.json({ success: true, bookmarked: true });
  } catch (err) {
    console.error("[Bookmarks/POST]", err);
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}
