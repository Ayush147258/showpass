import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// ── Provider config ───────────────────────────────────────────────────
interface ProviderState {
  rpm: number;
  rpd: number;
  rpmResetAt: number;
  rpdResetAt: number;
}

const LIMITS = {
  gemini:     { rpm: 14, rpd: 1400 },   // keep 1 under hard limit as safety
  groq:       { rpm: 28, rpd: 14000 },
  openrouter: { rpm: 18, rpd: 180 },
};

const state = new Map<string, ProviderState>();

function getState(provider: string): ProviderState {
  const now = Date.now();
  const existing = state.get(provider);
  if (!existing) {
    const fresh = { rpm: 0, rpd: 0, rpmResetAt: now + 60_000, rpdResetAt: now + 86_400_000 };
    state.set(provider, fresh);
    return fresh;
  }
  if (now > existing.rpmResetAt) { existing.rpm = 0; existing.rpmResetAt = now + 60_000; }
  if (now > existing.rpdResetAt) { existing.rpd = 0; existing.rpdResetAt = now + 86_400_000; }
  return existing;
}

function hasCapacity(provider: keyof typeof LIMITS): boolean {
  const s = getState(provider);
  const l = LIMITS[provider];
  return s.rpm < l.rpm && s.rpd < l.rpd;
}

function consume(provider: keyof typeof LIMITS) {
  const s = getState(provider);
  s.rpm++;
  s.rpd++;
}

// ── Provider call functions ───────────────────────────────────────────
async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 900,
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function callGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      { role: "user", content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content ?? "";
}

async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://showpass.live",
      "X-Title": "SHOWPASS",
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      max_tokens: 900,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Main router ───────────────────────────────────────────────────────
export type AIFeature =
  | "generate-description"
  | "recommend-events"
  | "schedule-builder"
  | "summarise-feedback"
  | "general";

interface RouterOptions {
  prompt: string;
  systemPrompt?: string;
  feature?: AIFeature;
  userId?: string;
}

// Feature → preferred provider (falls back automatically)
const FEATURE_PREFERENCE: Record<AIFeature, Array<keyof typeof LIMITS>> = {
  "generate-description": ["gemini", "groq", "openrouter"],
  "schedule-builder":     ["gemini", "groq", "openrouter"],
  "recommend-events":     ["groq", "gemini", "openrouter"],
  "summarise-feedback":   ["groq", "gemini", "openrouter"],
  "general":              ["gemini", "groq", "openrouter"],
};

export async function aiRoute({ prompt, systemPrompt, feature = "general", userId }: RouterOptions): Promise<{
  result: string;
  provider: string;
  success: boolean;
}> {
  const chain = FEATURE_PREFERENCE[feature];

  for (const provider of chain) {
    if (!hasCapacity(provider)) continue;

    consume(provider);

    try {
      let result: string;
      switch (provider) {
        case "gemini":     result = await callGemini(prompt, systemPrompt); break;
        case "groq":       result = await callGroq(prompt, systemPrompt); break;
        case "openrouter": result = await callOpenRouter(prompt, systemPrompt); break;
      }

      // Log usage (fire and forget)
      if (userId) {
        import("@/lib/prisma").then(({ prisma }) =>
          prisma.aiUsageLog.create({
            data: { userId, feature, provider, tokensUsed: Math.ceil(prompt.length / 4), success: true },
          }).catch(() => {})
        );
      }

      return { result: result!, provider, success: true };
    } catch (err) {
      console.error(`[AI Router] ${provider} failed:`, err);
      continue;
    }
  }

  return {
    result: "AI is temporarily at capacity. Please try again in a moment.",
    provider: "none",
    success: false,
  };
}
