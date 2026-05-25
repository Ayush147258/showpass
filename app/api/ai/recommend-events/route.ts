import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiRoute } from "@/lib/ai-router";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();

  try {
    const body = await req.json();
    const { limit = 6 } = body;

    // Fetch upcoming published events
    const upcomingEvents = await prisma.event.findMany({
      where: {
        isPublished: true,
        startAt: { gte: new Date() },
      },
      include: {
        ticketTiers: { select: { price: true, type: true }, orderBy: { sortOrder: "asc" } },
        _count: { select: { reviews: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { startAt: "asc" }],
      take: 40,
    });

    if (upcomingEvents.length === 0) {
      return NextResponse.json({ success: true, data: [], provider: "none" });
    }

    // If no session, return featured/popular events ranked by registrations
    if (!session?.user) {
      const popular = [...upcomingEvents]
        .sort((a, b) => {
          const scoreA = (a.isFeatured ? 100 : 0) + a._count.reviews;
          const scoreB = (b.isFeatured ? 100 : 0) + b._count.reviews;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      return NextResponse.json({ success: true, data: popular, provider: "default", personalised: false });
    }

    // Fetch user's event history
    const [pastOrders, bookmarks] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId: session.user.id, status: "PAID" },
        include: { event: { select: { category: true, city: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.bookmark.findMany({
        where: { userId: session.user.id },
        include: { event: { select: { category: true, city: true } } },
        take: 10,
      }),
    ]);

    // If no history, return popular
    if (pastOrders.length === 0 && bookmarks.length === 0) {
      return NextResponse.json({
        success: true,
        data: upcomingEvents.slice(0, limit),
        provider: "default",
        personalised: false,
      });
    }

    // Build user preference context
    const attendedCategories = pastOrders.map((o) => o.event.category);
    const bookmarkedCategories = bookmarks.map((b) => b.event.category);
    const cities = [...new Set([...pastOrders.map((o) => o.event.city), ...bookmarks.map((b) => b.event.city)])];

    // Build compact event list for the AI prompt (avoid sending full descriptions)
    const eventSummaries = upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      city: e.city,
      startAt: e.startAt,
      minPrice: Math.min(...e.ticketTiers.map((t) => t.price)),
      isFeatured: e.isFeatured,
      reviewCount: e._count.reviews,
    }));

    const systemPrompt = `You are a personalisation engine for SHOWPASS event platform. Given a user's history and a list of events, return a JSON array of event IDs ranked by relevance to the user. Output ONLY valid JSON — an array of strings like ["id1","id2","id3"]. No explanation, no markdown, no extra text.`;

    const prompt = `User history:
- Attended event categories: ${attendedCategories.join(", ") || "none"}
- Bookmarked categories: ${bookmarkedCategories.join(", ") || "none"}  
- Cities of interest: ${cities.join(", ") || "any"}

Available upcoming events (JSON):
${JSON.stringify(eventSummaries, null, 0)}

Return the ${limit} most relevant event IDs as a JSON array, ranked best-first. Consider: matching categories, same city, variety (don't repeat same category too many times), featured events get slight boost.`;

    const { result, provider, success } = await aiRoute({
      prompt,
      systemPrompt,
      feature: "recommend-events",
      userId: session.user.id,
    });

    if (!success) {
      // Fallback: category-match scoring
      const scored = upcomingEvents.map((e) => {
        const catScore = attendedCategories.filter((c) => c === e.category).length * 3
          + bookmarkedCategories.filter((c) => c === e.category).length * 2;
        const cityScore = cities.includes(e.city) ? 2 : 0;
        const featuredScore = e.isFeatured ? 1 : 0;
        return { event: e, score: catScore + cityScore + featuredScore };
      });
      const sorted = scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.event);
      return NextResponse.json({ success: true, data: sorted, provider: "fallback", personalised: true });
    }

    // Parse AI response
    let rankedIds: string[] = [];
    try {
      const cleaned = result.replace(/```json|```/g, "").trim();
      rankedIds = JSON.parse(cleaned);
    } catch {
      // If AI returns garbage JSON, fall back to first N events
      rankedIds = upcomingEvents.slice(0, limit).map((e) => e.id);
    }

    // Map IDs back to events, preserving AI order
    const eventMap = new Map(upcomingEvents.map((e) => [e.id, e]));
    const recommended = rankedIds
      .map((id) => eventMap.get(id))
      .filter(Boolean)
      .slice(0, limit) as typeof upcomingEvents;

    // If AI returned fewer than limit, pad with remaining events
    if (recommended.length < limit) {
      const seen = new Set(recommended.map((e) => e.id));
      for (const e of upcomingEvents) {
        if (!seen.has(e.id)) {
          recommended.push(e);
          if (recommended.length >= limit) break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: recommended,
      provider,
      personalised: true,
    });
  } catch (err) {
    console.error("[AI/RecommendEvents]", err);
    return NextResponse.json({ error: "Recommendation failed" }, { status: 500 });
  }
}
