import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiRoute } from "@/lib/ai-router";
import { z } from "zod";

const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  speakerName: z.string().optional(),
  durationMins: z.number().int().min(5).max(480),
  category: z.enum(["keynote", "talk", "workshop", "panel", "break", "networking", "performance", "other"]).default("talk"),
  preferredSlot: z.enum(["morning", "afternoon", "evening", "any"]).default("any"),
  audienceLevel: z.enum(["beginner", "intermediate", "advanced", "all"]).default("all"),
  requiresSetup: z.boolean().default(false),
  notes: z.string().optional(),
});

const Schema = z.object({
  eventTitle: z.string(),
  eventDate: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  venueCapacity: z.number().optional(),
  sessions: z.array(SessionSchema).min(2).max(30),
  constraints: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ORGANISER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only organisers can use the schedule builder" }, { status: 403 });
  }

  try {
    const body = Schema.parse(await req.json());

    const totalMins = body.sessions.reduce((s, ses) => s + ses.durationMins, 0);

    // Parse start/end to minutes from midnight
    const toMins = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const fromMins = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const availableMins = toMins(body.endTime) - toMins(body.startTime);

    const systemPrompt = `You are a professional event schedule planner. Create an optimal schedule and return ONLY valid JSON — no markdown, no explanation.

SCHEDULING PRINCIPLES:
1. Keynotes always open or close a day
2. High-energy sessions in morning, workshops in afternoon
3. Beginner sessions before advanced ones (progression)
4. Add 10-15min buffer after sessions requiring setup
5. Breaks every 90-120 minutes
6. Networking sessions work best at the end
7. Never schedule back-to-back workshops without a break

JSON output shape:
{
  "schedule": [
    {
      "sessionId": "original session id",
      "title": "session title",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "slot": 1,
      "notes": "brief reason for this placement"
    }
  ],
  "breaks": [
    { "startTime": "HH:MM", "endTime": "HH:MM", "type": "short|lunch|networking" }
  ],
  "summary": "2-sentence explanation of the schedule logic",
  "warnings": ["any scheduling conflicts or concerns"]
}`;

    const prompt = `Build the optimal schedule for: "${body.eventTitle}"
Date: ${body.eventDate}
Time window: ${body.startTime} – ${body.endTime} (${availableMins} minutes available)
Total session time: ${totalMins} minutes
Buffer needed: ${availableMins - totalMins} minutes for breaks
${body.constraints ? `Organiser constraints: ${body.constraints}` : ""}

Sessions to schedule:
${JSON.stringify(body.sessions, null, 2)}

Create the optimal schedule now:`;

    const { result, provider, success } = await aiRoute({
      prompt,
      systemPrompt,
      feature: "schedule-builder",
      userId: session.user.id,
    });

    if (!success) {
      // Deterministic fallback: sort by category priority + preferred slot
      const categoryOrder: Record<string, number> = {
        keynote: 0, talk: 1, panel: 2, workshop: 3, performance: 4, networking: 5, break: 6, other: 7,
      };
      const sorted = [...body.sessions].sort(
        (a, b) => (categoryOrder[a.category] ?? 7) - (categoryOrder[b.category] ?? 7)
      );
      let cursor = toMins(body.startTime);
      const schedule = sorted.map((s, i) => {
        const start = cursor;
        cursor += s.durationMins;
        if (s.requiresSetup) cursor += 10;
        if ((i + 1) % 3 === 0) cursor += 15; // break every 3 sessions
        return {
          sessionId: s.id,
          title: s.title,
          startTime: fromMins(start),
          endTime: fromMins(start + s.durationMins),
          slot: i + 1,
          notes: "Auto-scheduled by category priority",
        };
      });
      return NextResponse.json({
        success: true,
        data: { schedule, breaks: [], summary: "Auto-scheduled using category priority rules.", warnings: [], provider: "fallback" },
      });
    }

    // Parse AI JSON
    let parsed: Record<string, unknown> = {};
    try {
      const cleaned = result.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned invalid schedule format. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { ...parsed, provider } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    console.error("[AI/ScheduleBuilder]", err);
    return NextResponse.json({ error: "Schedule building failed" }, { status: 500 });
  }
}
