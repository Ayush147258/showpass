"use client";
import { getTheme, VIP_BLACK_CARD } from "@/lib/ticket-themes";
import { formatDateTime } from "@/lib/utils";
import type { TicketWithRelations } from "@/types";
import Image from "next/image";

interface TicketStubProps {
  ticket: TicketWithRelations;
  qrDataUrl: string;
  compact?: boolean;
}

export function TicketStub({ ticket, qrDataUrl, compact = false }: TicketStubProps) {
  const baseTheme = getTheme(ticket.tier.event.category);
  const isVIP = ticket.tier.type === "VIP" || ticket.tier.type === "PREMIUM";
  const theme = isVIP ? { ...baseTheme, ...VIP_BLACK_CARD } : baseTheme;
  const tierStyle = baseTheme.tierColors[ticket.tier.type] ?? baseTheme.tierColors.GENERAL;

  return (
    <div
      id={`ticket-${ticket.id}`}
      className="relative overflow-hidden select-none"
      style={{
        width: compact ? "100%" : "680px",
        maxWidth: "100%",
        borderRadius: "20px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      {/* Holographic shimmer strip (top edge) */}
      {theme.holographic && (
        <div
          style={{
            height: "4px",
            background: "linear-gradient(90deg, #FF6B35, #FFB800, #00D4AA, #7B2FBE, #FF6B35)",
            backgroundSize: "300% 100%",
            animation: "shimmer 3s linear infinite",
          }}
        />
      )}

      {/* Main ticket body */}
      <div
        style={{
          background: theme.bgCard,
          display: "flex",
          flexDirection: compact ? "column" : "row",
          minHeight: compact ? "auto" : "200px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: theme.pattern,
            backgroundSize: "60px 60px",
            opacity: 0.4,
          }}
        />

        {/* Left colour strip */}
        <div
          style={{
            width: compact ? "100%" : "6px",
            height: compact ? "4px" : "auto",
            background: theme.stripColor,
            flexShrink: 0,
          }}
        />

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: compact ? "column" : "row",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* LEFT SECTION — Event info */}
          <div
            style={{
              flex: compact ? "none" : "1 1 65%",
              padding: compact ? "20px 20px 16px" : "28px 32px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Theme name badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: theme.accent,
                  opacity: 0.8,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ⚡ SHOWPASS × {theme.name}
              </span>
            </div>

            {/* Event title */}
            <div>
              <h2
                style={{
                  fontSize: compact ? "18px" : "26px",
                  fontWeight: "800",
                  color: theme.textPrimary,
                  lineHeight: "1.15",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  fontFamily: "'Clash Display', 'Sora', sans-serif",
                }}
              >
                {ticket.tier.event.title}
              </h2>
            </div>

            {/* Details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <InfoBlock label="DATE & TIME" value={formatDateTime(ticket.tier.event.startAt)} theme={theme} />
              <InfoBlock label="VENUE" value={ticket.tier.event.venue} theme={theme} />
              <InfoBlock label="CITY" value={ticket.tier.event.city} theme={theme} />
              <InfoBlock label="TICKET REF" value={ticket.ticketRef} mono theme={theme} />
            </div>

            {/* Attendee + tier */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "12px",
                borderTop: `1px dashed ${theme.border}`,
              }}
            >
              <div>
                <p style={{ fontSize: "10px", color: theme.textSecondary, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 2px" }}>
                  Attendee
                </p>
                <p style={{ fontSize: "14px", fontWeight: "700", color: theme.textPrimary, margin: 0 }}>
                  {ticket.attendeeName}
                </p>
              </div>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: tierStyle.bg,
                  border: `1px solid ${tierStyle.border}`,
                  fontSize: "12px",
                  fontWeight: "700",
                  color: tierStyle.text,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {ticket.tier.type === "EARLY_BIRD" ? "EARLY BIRD" : ticket.tier.type}
              </div>
            </div>
          </div>

          {/* Perforation divider */}
          {!compact && (
            <div
              style={{
                width: "1px",
                background: `repeating-linear-gradient(to bottom, transparent, transparent 6px, ${theme.border} 6px, ${theme.border} 12px)`,
                position: "relative",
                flexShrink: 0,
              }}
            >
              {/* Notch circles */}
              <div style={{ position: "absolute", top: "-10px", left: "-10px", width: "20px", height: "20px", borderRadius: "50%", background: "hsl(var(--background, #fff))", border: `1px solid ${theme.border}` }} />
              <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "20px", height: "20px", borderRadius: "50%", background: "hsl(var(--background, #fff))", border: `1px solid ${theme.border}` }} />
            </div>
          )}

          {/* RIGHT SECTION — QR code */}
          <div
            style={{
              flex: compact ? "none" : "0 0 200px",
              padding: compact ? "0 20px 20px" : "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            {compact && (
              <div style={{ width: "100%", height: "1px", background: `repeating-linear-gradient(to right, transparent, transparent 6px, ${theme.border} 6px, ${theme.border} 12px)`, marginBottom: "4px" }} />
            )}

            {/* QR Code */}
            <div
              style={{
                padding: "10px",
                borderRadius: "12px",
                background: "#FFFFFF",
                boxShadow: `0 0 0 2px ${theme.accent}40`,
              }}
            >
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR Code" width={120} height={120} style={{ display: "block" }} />
              ) : (
                <div style={{ width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 12 }}>
                  QR Code
                </div>
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "9px",
                  color: theme.textSecondary,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Scan to verify
              </p>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: theme.accent,
                  fontFamily: "'JetBrains Mono', monospace",
                  margin: 0,
                  letterSpacing: "0.05em",
                }}
              >
                {ticket.ticketRef}
              </p>
            </div>

            {/* ADMIT text */}
            <div
              style={{
                width: "100%",
                textAlign: "center",
                padding: "8px",
                borderRadius: "10px",
                background: `linear-gradient(135deg, rgba(${theme.accentRgb},0.15), rgba(${theme.accentRgb},0.05))`,
                border: `1px solid rgba(${theme.accentRgb},0.25)`,
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.25em",
                  color: theme.accent,
                  margin: 0,
                  fontFamily: "'Clash Display', sans-serif",
                }}
              >
                ADMIT ONE
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          background: `rgba(${theme.accentRgb}, 0.06)`,
          borderTop: `1px solid rgba(${theme.accentRgb}, 0.15)`,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: theme.accent, fontFamily: "'Clash Display', sans-serif" }}>
          ⚡ SHOWPASS
        </span>
        <span style={{ fontSize: "10px", color: theme.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
          {ticket.isCheckedIn ? "✅ CHECKED IN" : "NOT USED"}
        </span>
        <span style={{ fontSize: "10px", color: theme.textSecondary }}>showpass.live</span>
      </div>
    </div>
  );
}

function InfoBlock({
  label, value, mono = false, theme,
}: {
  label: string; value: string; mono?: boolean;
  theme: { textPrimary: string; textSecondary: string };
}) {
  return (
    <div>
      <p style={{ fontSize: "9px", color: theme.textSecondary, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 2px" }}>
        {label}
      </p>
      <p style={{
        fontSize: "12px", fontWeight: "600", color: theme.textPrimary, margin: 0,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
        letterSpacing: mono ? "0.05em" : "inherit",
      }}>
        {value}
      </p>
    </div>
  );
}
