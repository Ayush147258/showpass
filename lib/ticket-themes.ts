import { EventCategory } from "@prisma/client";

export interface TicketTheme {
  id: string;
  name: string;
  bg: string;           // CSS background
  bgCard: string;       // ticket card background
  accent: string;       // hex accent
  accentRgb: string;    // for rgba() usage
  textPrimary: string;
  textSecondary: string;
  border: string;
  pattern: string;      // CSS background-image for watermark pattern
  fontDisplay: string;  // display font style
  holographic: boolean; // show rainbow shimmer strip
  stripColor: string;   // left color strip
  tierColors: Record<string, { bg: string; text: string; border: string }>;
}

export const TICKET_THEMES: Record<EventCategory, TicketTheme> = {
  MUSIC: {
    id: "neon-rave",
    name: "NEON RAVE",
    bg: "linear-gradient(135deg, #0D0221 0%, #1A0533 40%, #0D0221 100%)",
    bgCard: "#12042B",
    accent: "#FF0F7B",
    accentRgb: "255, 15, 123",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.6)",
    border: "rgba(255, 15, 123, 0.4)",
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cpath d='M10 30 Q15 20 20 30 Q25 40 30 30 Q35 20 40 30 Q45 40 50 30' stroke='rgba(255,15,123,0.15)' stroke-width='2' fill='none'/%3E%3C/g%3E%3C/svg%3E")`,
    fontDisplay: "font-clash font-bold tracking-tight",
    holographic: true,
    stripColor: "linear-gradient(180deg, #FF0F7B, #7B2FBE)",
    tierColors: {
      GENERAL:    { bg: "rgba(255,15,123,0.15)", text: "#FF0F7B", border: "rgba(255,15,123,0.4)" },
      VIP:        { bg: "rgba(255,184,0,0.15)",  text: "#FFB800", border: "rgba(255,184,0,0.4)" },
      EARLY_BIRD: { bg: "rgba(0,212,170,0.15)",  text: "#00D4AA", border: "rgba(0,212,170,0.4)" },
      FREE:       { bg: "rgba(255,255,255,0.1)", text: "#FFFFFF", border: "rgba(255,255,255,0.3)" },
      PREMIUM:    { bg: "rgba(255,184,0,0.2)",   text: "#FFD700", border: "rgba(255,184,0,0.6)" },
    },
  },

  COLLEGE_FEST: {
    id: "campus-energy",
    name: "CAMPUS ENERGY",
    bg: "linear-gradient(135deg, #0A1628 0%, #1A3490 60%, #0A1628 100%)",
    bgCard: "#0D1F45",
    accent: "#FF6B35",
    accentRgb: "255, 107, 53",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.65)",
    border: "rgba(255, 107, 53, 0.45)",
    pattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='rgba(255,107,53,0.07)'%3E%3Crect x='0' y='0' width='20' height='20'/%3E%3Crect x='20' y='20' width='20' height='20'/%3E%3C/g%3E%3C/svg%3E")`,
    fontDisplay: "font-clash font-bold tracking-tight",
    holographic: false,
    stripColor: "linear-gradient(180deg, #FF6B35, #FFB800)",
    tierColors: {
      GENERAL:    { bg: "rgba(255,107,53,0.15)", text: "#FF6B35", border: "rgba(255,107,53,0.4)" },
      VIP:        { bg: "rgba(255,184,0,0.15)",  text: "#FFB800", border: "rgba(255,184,0,0.4)" },
      EARLY_BIRD: { bg: "rgba(0,212,170,0.15)",  text: "#00D4AA", border: "rgba(0,212,170,0.4)" },
      FREE:       { bg: "rgba(255,255,255,0.1)", text: "#FFFFFF", border: "rgba(255,255,255,0.3)" },
      PREMIUM:    { bg: "rgba(255,184,0,0.2)",   text: "#FFD700", border: "rgba(255,184,0,0.6)" },
    },
  },

  TECH: {
    id: "terminal-green",
    name: "TERMINAL GREEN",
    bg: "linear-gradient(135deg, #020A06 0%, #041A0C 60%, #020A06 100%)",
    bgCard: "#031208",
    accent: "#00FF88",
    accentRgb: "0, 255, 136",
    textPrimary: "#00FF88",
    textSecondary: "rgba(0,255,136,0.6)",
    border: "rgba(0, 255, 136, 0.3)",
    pattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(0,255,136,0.06)' stroke-width='1'%3E%3Cpath d='M10 0 L10 80 M20 0 L20 80 M30 0 L30 80 M40 0 L40 80 M50 0 L50 80 M60 0 L60 80 M70 0 L70 80'/%3E%3Cpath d='M0 10 L80 10 M0 20 L80 20 M0 30 L80 30 M0 40 L80 40 M0 50 L80 50 M0 60 L80 60 M0 70 L80 70'/%3E%3C/g%3E%3C/svg%3E")`,
    fontDisplay: "font-mono font-bold tracking-widest",
    holographic: false,
    stripColor: "linear-gradient(180deg, #00FF88, #00D4AA)",
    tierColors: {
      GENERAL:    { bg: "rgba(0,255,136,0.1)",  text: "#00FF88", border: "rgba(0,255,136,0.3)" },
      VIP:        { bg: "rgba(0,212,170,0.1)",  text: "#00D4AA", border: "rgba(0,212,170,0.4)" },
      EARLY_BIRD: { bg: "rgba(255,184,0,0.1)",  text: "#FFB800", border: "rgba(255,184,0,0.3)" },
      FREE:       { bg: "rgba(0,255,136,0.05)", text: "#00FF88", border: "rgba(0,255,136,0.2)" },
      PREMIUM:    { bg: "rgba(255,255,255,0.1)", text: "#FFFFFF", border: "rgba(255,255,255,0.3)" },
    },
  },

  COMEDY: {
    id: "velvet-stage",
    name: "VELVET STAGE",
    bg: "linear-gradient(135deg, #1C0630 0%, #3D1063 60%, #1C0630 100%)",
    bgCard: "#240840",
    accent: "#FFB800",
    accentRgb: "255, 184, 0",
    textPrimary: "#FFE4A0",
    textSecondary: "rgba(255,228,160,0.65)",
    border: "rgba(255, 184, 0, 0.35)",
    pattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='50' cy='0' rx='40' ry='20' fill='none' stroke='rgba(255,184,0,0.06)' stroke-width='2'/%3E%3Cellipse cx='50' cy='100' rx='40' ry='20' fill='none' stroke='rgba(255,184,0,0.06)' stroke-width='2'/%3E%3C/svg%3E")`,
    fontDisplay: "font-clash font-bold tracking-tight",
    holographic: true,
    stripColor: "linear-gradient(180deg, #FFB800, #FF6B35)",
    tierColors: {
      GENERAL:    { bg: "rgba(255,184,0,0.15)",  text: "#FFB800", border: "rgba(255,184,0,0.4)" },
      VIP:        { bg: "rgba(255,215,0,0.2)",   text: "#FFD700", border: "rgba(255,215,0,0.5)" },
      EARLY_BIRD: { bg: "rgba(0,212,170,0.1)",   text: "#00D4AA", border: "rgba(0,212,170,0.3)" },
      FREE:       { bg: "rgba(255,228,160,0.1)", text: "#FFE4A0", border: "rgba(255,228,160,0.3)" },
      PREMIUM:    { bg: "rgba(255,215,0,0.25)",  text: "#FFD700", border: "rgba(255,215,0,0.6)" },
    },
  },

  FITNESS: {
    id: "surge",
    name: "SURGE",
    bg: "linear-gradient(135deg, #001A1A 0%, #003333 60%, #001A1A 100%)",
    bgCard: "#002222",
    accent: "#00D4AA",
    accentRgb: "0, 212, 170",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.65)",
    border: "rgba(0, 212, 170, 0.4)",
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='0,60 30,0 60,60' fill='none' stroke='rgba(0,212,170,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
    fontDisplay: "font-clash font-bold tracking-tight uppercase",
    holographic: false,
    stripColor: "linear-gradient(180deg, #00D4AA, #EF4444)",
    tierColors: {
      GENERAL:    { bg: "rgba(0,212,170,0.15)", text: "#00D4AA", border: "rgba(0,212,170,0.4)" },
      VIP:        { bg: "rgba(239,68,68,0.15)", text: "#EF4444", border: "rgba(239,68,68,0.4)" },
      EARLY_BIRD: { bg: "rgba(255,184,0,0.15)", text: "#FFB800", border: "rgba(255,184,0,0.4)" },
      FREE:       { bg: "rgba(0,212,170,0.08)", text: "#00D4AA", border: "rgba(0,212,170,0.2)" },
      PREMIUM:    { bg: "rgba(239,68,68,0.2)",  text: "#EF4444", border: "rgba(239,68,68,0.5)" },
    },
  },

  FOOD: {
    id: "golden-hour",
    name: "GOLDEN HOUR",
    bg: "linear-gradient(135deg, #2D1B00 0%, #4A2E00 60%, #2D1B00 100%)",
    bgCard: "#3A2200",
    accent: "#FFB800",
    accentRgb: "255, 184, 0",
    textPrimary: "#FFF8E1",
    textSecondary: "rgba(255,248,225,0.65)",
    border: "rgba(255, 184, 0, 0.35)",
    pattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='30' fill='none' stroke='rgba(255,184,0,0.07)' stroke-width='2'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='rgba(255,184,0,0.05)' stroke-width='2'/%3E%3C/svg%3E")`,
    fontDisplay: "font-clash font-bold tracking-tight",
    holographic: false,
    stripColor: "linear-gradient(180deg, #FFB800, #FF6B35)",
    tierColors: {
      GENERAL:    { bg: "rgba(255,184,0,0.15)",  text: "#FFB800", border: "rgba(255,184,0,0.4)" },
      VIP:        { bg: "rgba(255,107,53,0.15)", text: "#FF6B35", border: "rgba(255,107,53,0.4)" },
      EARLY_BIRD: { bg: "rgba(0,212,170,0.1)",   text: "#00D4AA", border: "rgba(0,212,170,0.3)" },
      FREE:       { bg: "rgba(255,248,225,0.1)", text: "#FFF8E1", border: "rgba(255,248,225,0.3)" },
      PREMIUM:    { bg: "rgba(255,184,0,0.25)",  text: "#FFD700", border: "rgba(255,184,0,0.6)" },
    },
  },

  WORKSHOP: {
    id: "deep-focus",
    name: "DEEP FOCUS",
    bg: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
    bgCard: "#FFFFFF",
    accent: "#3B82F6",
    accentRgb: "59, 130, 246",
    textPrimary: "#0A1628",
    textSecondary: "#64748B",
    border: "rgba(59, 130, 246, 0.25)",
    pattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(59,130,246,0.2)'/%3E%3C/svg%3E")`,
    fontDisplay: "font-clash font-bold tracking-tight",
    holographic: false,
    stripColor: "linear-gradient(180deg, #3B82F6, #6366F1)",
    tierColors: {
      GENERAL:    { bg: "rgba(59,130,246,0.1)",  text: "#3B82F6", border: "rgba(59,130,246,0.3)" },
      VIP:        { bg: "rgba(99,102,241,0.1)",  text: "#6366F1", border: "rgba(99,102,241,0.3)" },
      EARLY_BIRD: { bg: "rgba(16,185,129,0.1)",  text: "#10B981", border: "rgba(16,185,129,0.3)" },
      FREE:       { bg: "rgba(59,130,246,0.06)", text: "#3B82F6", border: "rgba(59,130,246,0.2)" },
      PREMIUM:    { bg: "rgba(99,102,241,0.15)", text: "#6366F1", border: "rgba(99,102,241,0.4)" },
    },
  },

  SPORTS: {
    id: "gameday",
    name: "GAME DAY",
    bg: "linear-gradient(135deg, #0F1A10 0%, #1A3320 60%, #0F1A10 100%)",
    bgCard: "#122016",
    accent: "#22C55E",
    accentRgb: "34, 197, 94",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.65)",
    border: "rgba(34, 197, 94, 0.35)",
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='60' height='60' fill='none' stroke='rgba(34,197,94,0.06)' stroke-width='1'/%3E%3Cline x1='0' y1='30' x2='60' y2='30' stroke='rgba(34,197,94,0.05)' stroke-width='1'/%3E%3C/svg%3E")`,
    fontDisplay: "font-clash font-bold tracking-tight uppercase",
    holographic: false,
    stripColor: "linear-gradient(180deg, #22C55E, #16A34A)",
    tierColors: {
      GENERAL:    { bg: "rgba(34,197,94,0.15)", text: "#22C55E", border: "rgba(34,197,94,0.4)" },
      VIP:        { bg: "rgba(255,184,0,0.15)", text: "#FFB800", border: "rgba(255,184,0,0.4)" },
      EARLY_BIRD: { bg: "rgba(0,212,170,0.1)",  text: "#00D4AA", border: "rgba(0,212,170,0.3)" },
      FREE:       { bg: "rgba(34,197,94,0.08)", text: "#22C55E", border: "rgba(34,197,94,0.2)" },
      PREMIUM:    { bg: "rgba(255,184,0,0.2)",  text: "#FFD700", border: "rgba(255,184,0,0.5)" },
    },
  },

  OTHER: {
    id: "showpass-classic",
    name: "SHOWPASS",
    bg: "linear-gradient(135deg, #0A1628 0%, #1A2B50 60%, #0A1628 100%)",
    bgCard: "#0D1F40",
    accent: "#FF6B35",
    accentRgb: "255, 107, 53",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.65)",
    border: "rgba(255, 107, 53, 0.35)",
    pattern: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='20' fill='none' stroke='rgba(255,107,53,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
    fontDisplay: "font-clash font-bold tracking-tight",
    holographic: true,
    stripColor: "linear-gradient(180deg, #FF6B35, #7B2FBE)",
    tierColors: {
      GENERAL:    { bg: "rgba(255,107,53,0.15)", text: "#FF6B35", border: "rgba(255,107,53,0.4)" },
      VIP:        { bg: "rgba(123,47,190,0.15)", text: "#7B2FBE", border: "rgba(123,47,190,0.4)" },
      EARLY_BIRD: { bg: "rgba(0,212,170,0.15)",  text: "#00D4AA", border: "rgba(0,212,170,0.4)" },
      FREE:       { bg: "rgba(255,255,255,0.1)", text: "#FFFFFF", border: "rgba(255,255,255,0.3)" },
      PREMIUM:    { bg: "rgba(255,184,0,0.2)",   text: "#FFD700", border: "rgba(255,184,0,0.5)" },
    },
  },
};

export function getTheme(category: EventCategory): TicketTheme {
  return TICKET_THEMES[category] ?? TICKET_THEMES.OTHER;
}

// VIP Black Card overlay — applies ON TOP of any theme for VIP tier
export const VIP_BLACK_CARD: Partial<TicketTheme> = {
  bg: "linear-gradient(135deg, #0D0D0D 0%, #1C1C1C 50%, #0D0D0D 100%)",
  bgCard: "#111111",
  accent: "#C9A94B",
  accentRgb: "201, 169, 75",
  textPrimary: "#F5E6C8",
  textSecondary: "rgba(245,230,200,0.6)",
  border: "rgba(201, 169, 75, 0.45)",
  holographic: true,
  stripColor: "linear-gradient(180deg, #C9A94B, #8B6914)",
};
