import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiRoute } from "@/lib/ai-router";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  eventId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { eventId } = Schema.parse(await req.json());

    // Verify organiser owns event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, organiserId: true, startAt: true },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (event.organiserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where: { eventId },
      select: { rating: true, body: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    if (reviews.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: "No reviews yet. Share a feedback form with attendees after the event.",
          totalReviews: 0,
          avgRating: 0,
          sentiments: { positive: 0, neutral: 0, negative: 0 },
          themes: [],
          suggestions: [],
        },
      });
    }

    // Compute stats
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    const withText = reviews.filter((r) => r.body && r.body.trim().length > 10);

    const systemPrompt = `You are an event analytics assistant. Analyse attendee reviews and return structured JSON insights for the event organiser. Output ONLY valid JSON — no markdown, no explanation.

JSON shape:
{
  "summary": "2-3 sentence executive summary",
  "overallSentiment": "positive" | "mixed" | "negative",
  "sentiments": { "positive": number, "neutral": number, "negative": number },
  "topPraises": ["string", "string", "string"],
  "topComplaints": ["string", "string"],
  "themes": ["string", "string", "string"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
  "highlightQuote": "best review quote verbatim (if any)"
}`;

    const prompt = `Event: "${event.title}"
Total reviews: ${reviews.length}
Average rating: ${avgRating.toFixed(1)}/5
Rating distribution: ${[5, 4, 3, 2, 1].map((r) => `${r}★: ${reviews.filter((rv) => rv.rating === r).length}`).join(", ")}

Review texts (sample of ${Math.min(withText.length, 50)}):
${withText
  .slice(0, 50)
  .map((r, i) => `[${r.rating}★] ${r.body}`)
  .join("\n")}

Analyse and return JSON:`;

    const { result, provider, success } = await aiRoute({
      prompt,
      systemPrompt,
      feature: "summarise-feedback",
      userId: session.user.id,
    });

    if (!success) {
      // Manual fallback stats
      const pos = reviews.filter((r) => r.rating >= 4).length;
      const neg = reviews.filter((r) => r.rating <= 2).length;
      return NextResponse.json({
        success: true,
        data: {
          summary: `${reviews.length} attendees reviewed this event with an average rating of ${avgRating.toFixed(1)}/5.`,
          avgRating,
          totalReviews: reviews.length,
          sentiments: { positive: pos, neutral: reviews.length - pos - neg, negative: neg },
          themes: [],
          suggestions: [],
          provider: "fallback",
        },
      });
    }

    // Parse AI JSON
    let parsed: Record<string, unknown> = {};
    try {
      const cleaned = result.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { summary: result.slice(0, 500) };
    }

    return NextResponse.json({
      success: true,
      data: {
        ...parsed,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        provider,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    console.error("[AI/SummariseFeedback]", err);
    return NextResponse.json({ error: "Feedback summary failed" }, { status: 500 });
  }
}
