import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiRoute } from "@/lib/ai-router";
import { z } from "zod";

const Schema = z.object({
  bullets: z.string().min(10).max(2000),
  tone: z.enum(["hype", "professional", "casual"]).default("hype"),
  eventTitle: z.string().optional(),
  category: z.string().optional(),
});

const TONE_INSTRUCTIONS: Record<string, string> = {
  hype: `Write in an electric, energetic, FOMO-inducing tone. Use vivid language. Make people feel they CANNOT miss this. Short punchy sentences mixed with longer dramatic ones. Use line breaks for rhythm. No emojis.`,
  professional: `Write in a clear, credible, informative tone. Lead with the value proposition. Include key facts naturally. Professional but not cold. Suitable for corporate and educational events.`,
  casual: `Write in a warm, friendly, conversational tone. Like you're telling a friend about something amazing. Relaxed but enthusiastic. Make it feel approachable and fun.`,
};

export async function POST(req: NextRequest) {
  const session = await auth();

  try {
    const body = Schema.parse(await req.json());

    const systemPrompt = `You are an expert event copywriter for SHOWPASS, India's premier event platform. You write compelling event descriptions that sell tickets.

RULES:
- Write 3–5 paragraphs (150–300 words total)
- Start with the hook — the single most exciting thing about this event
- Naturally weave in the details from the bullet points
- End with a call to action that creates urgency
- Never use phrases like "Join us for" or "We are excited to present"
- Never start with the event name
- Output ONLY the description text — no title, no labels, no markdown headers
- ${TONE_INSTRUCTIONS[body.tone]}`;

    const prompt = `Write a compelling event description for ${body.eventTitle ? `"${body.eventTitle}"` : "this event"} (Category: ${body.category ?? "general"}).

Event highlights provided by the organiser:
${body.bullets}

Tone required: ${body.tone}

Write the description now:`;

    const { result, provider, success } = await aiRoute({
      prompt,
      systemPrompt,
      feature: "generate-description",
      userId: session?.user?.id,
    });

    if (!success) {
      return NextResponse.json(
        { error: "AI is at capacity. Please try again in 60 seconds." },
        { status: 503 }
      );
    }

    // Clean up any accidental markdown the model may add
    const cleaned = result
      .replace(/^#+\s.*/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .trim();

    return NextResponse.json({
      success: true,
      description: cleaned,
      provider,
      wordCount: cleaned.split(/\s+/).length,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    console.error("[AI/GenerateDescription]", err);
    return NextResponse.json({ error: "Description generation failed" }, { status: 500 });
  }
}
