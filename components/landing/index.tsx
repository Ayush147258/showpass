"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, Zap, QrCode, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const CATS = [
  { emoji: "🎵", label: "Music", cat: "MUSIC", color: "#FF0F7B" },
  { emoji: "🎓", label: "College Fest", cat: "COLLEGE_FEST", color: "#FF6B35" },
  { emoji: "💻", label: "Tech", cat: "TECH", color: "#00FF88" },
  { emoji: "🎭", label: "Comedy", cat: "COMEDY", color: "#FFB800" },
  { emoji: "🏋️", label: "Fitness", cat: "FITNESS", color: "#00D4AA" },
  { emoji: "🍽️", label: "Food & Culture", cat: "FOOD", color: "#FFB800" },
  { emoji: "📚", label: "Workshop", cat: "WORKSHOP", color: "#3B82F6" },
  { emoji: "⚽", label: "Sports", cat: "SPORTS", color: "#22C55E" },
];

export function CategoryPills() {
  const router = useRouter();
  return (
    <section className="py-10 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATS.map((c) => (
            <button
              key={c.cat}
              onClick={() => router.push(`/events?category=${c.cat}`)}
              className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-white/10 bg-white/4 hover:bg-white/8 transition-all group"
              style={{ "--cat-color": c.color } as React.CSSProperties}
            >
              <span className="text-xl">{c.emoji}</span>
              <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors whitespace-nowrap">
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const HOW_STEPS = [
  { icon: Ticket, title: "Discover Events", desc: "Browse thousands of events filtered by city, category, price, and date. AI surfaces what you'll love.", color: "text-accent", bg: "bg-accent/15", border: "border-accent/25" },
  { icon: Zap, title: "Book Instantly", desc: "Select your tier, apply a discount code, and checkout in seconds with Razorpay or UPI.", color: "text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/25" },
  { icon: QrCode, title: "Get Your Ticket", desc: "Receive a stunning uniquely-themed digital ticket with QR code instantly. Download as PDF.", color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/25" },
  { icon: BarChart3, title: "Show Up & Enjoy", desc: "Scan QR at the gate. Track your event history. Rate and review your experience after.", color: "text-gold-500", bg: "bg-gold-500/15", border: "border-gold-500/25" },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-navy-700/50 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">Simple as 1-2-3-4</p>
          <h2 className="font-clash text-4xl md:text-5xl font-bold text-white">How SHOWPASS Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-6 rounded-2xl border ${step.border} ${step.bg} group`}
            >
              <div className="absolute top-4 right-4 font-clash text-5xl font-bold text-white/5">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className={`w-11 h-11 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center mb-5`}>
                <step.icon className={`w-5 h-5 ${step.color}`} />
              </div>
              <h3 className="font-clash font-bold text-lg text-white mb-2">{step.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TICKET_SAMPLES = [
  { theme: "NEON RAVE", category: "Music", emoji: "🎵", bg: "linear-gradient(135deg, #0D0221, #1A0533)", accent: "#FF0F7B", strip: "linear-gradient(180deg, #FF0F7B, #7B2FBE)" },
  { theme: "TERMINAL GREEN", category: "Tech", emoji: "💻", bg: "linear-gradient(135deg, #020A06, #041A0C)", accent: "#00FF88", strip: "linear-gradient(180deg, #00FF88, #00D4AA)" },
  { theme: "CAMPUS ENERGY", category: "College Fest", emoji: "🎓", bg: "linear-gradient(135deg, #0A1628, #1A3490)", accent: "#FF6B35", strip: "linear-gradient(180deg, #FF6B35, #FFB800)" },
  { theme: "VELVET STAGE", category: "Comedy", emoji: "🎭", bg: "linear-gradient(135deg, #1C0630, #3D1063)", accent: "#FFB800", strip: "linear-gradient(180deg, #FFB800, #FF6B35)" },
];

export function TicketShowcase() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-teal-400 text-sm font-semibold uppercase tracking-widest mb-3">No two tickets look alike</p>
          <h2 className="font-clash text-4xl md:text-5xl font-bold text-white">
            Tickets That Are <span className="text-gradient-accent">Art</span>
          </h2>
          <p className="text-white/45 mt-4 max-w-xl mx-auto">
            Every event category generates a completely unique ticket design — dynamic colours, patterns, and typography. Yours to keep forever.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TICKET_SAMPLES.map((t, i) => (
            <motion.div
              key={t.theme}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl overflow-hidden shadow-ticket"
              style={{ background: t.bg }}
            >
              {/* Strip */}
              <div style={{ height: "4px", background: "linear-gradient(90deg, #FF6B35, #FFB800, #00D4AA, #7B2FBE)" }} />
              <div className="p-5">
                {/* Theme badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: t.accent }}>
                    ⚡ SHOWPASS × {t.theme}
                  </span>
                </div>
                {/* Mock event name */}
                <div className="font-clash font-bold text-lg text-white mb-3 leading-tight">
                  {t.emoji} {t.category} Event 2025
                </div>
                {/* Left strip */}
                <div className="flex gap-3">
                  <div className="w-1 rounded-full flex-shrink-0" style={{ background: t.strip }} />
                  <div className="space-y-2 flex-1">
                    <div className="h-2 rounded bg-white/10 w-3/4" />
                    <div className="h-2 rounded bg-white/8 w-1/2" />
                    <div className="h-2 rounded bg-white/6 w-2/3" />
                  </div>
                  {/* Mock QR */}
                  <div className="w-12 h-12 rounded-lg bg-white p-1 flex-shrink-0">
                    <div className="w-full h-full rounded" style={{ background: "repeating-linear-gradient(0deg, #000 0px, #000 2px, transparent 2px, transparent 4px), repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px)" }} />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/30">SP-{t.theme.slice(0,4)}-25-X7KM4P</span>
                  <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded" style={{ background: `${t.accent}25`, color: t.accent }}>
                    ADMIT ONE
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OrganizerCTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-accent/20 p-10 md:p-16"
          style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(123,47,190,0.08) 100%)" }}>
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/12 border border-accent/25 text-accent text-xs font-semibold mb-6">
                <Zap className="w-3 h-3 fill-current" /> For Organisers
              </div>
              <h2 className="font-clash text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Host your first event<br />free in 3 minutes
              </h2>
              <div className="space-y-2 mb-8">
                {[
                  "AI writes your event description",
                  "QR check-in system included",
                  "Real-time analytics dashboard",
                  "Only 3% commission on paid tickets",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white/65">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/auth"
                className="btn-primary inline-flex items-center gap-2"
              >
                Start Hosting Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {/* Mock dashboard preview */}
            <div className="flex-shrink-0 w-full md:w-72 bg-navy-700/80 border border-white/8 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-xs text-white/40 mb-3">Your Dashboard</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "Revenue", val: "₹84,200", color: "text-accent" },
                  { label: "Tickets", val: "312", color: "text-teal-400" },
                  { label: "Check-in", val: "91.9%", color: "text-gold-500" },
                  { label: "Events", val: "5", color: "text-purple-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/4 rounded-xl p-3">
                    <p className={`font-clash font-bold text-base ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-white/35">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {["NH7 Weekender 2025", "React India Conf", "Stand-Up Mumbai"].map((e, i) => (
                  <div key={e} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/4">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span className="text-xs text-white/60 flex-1 truncate">{e}</span>
                    <span className="text-[10px] text-white/30">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: "Rohan Verma", role: "Cultural Secretary, IIT-BHU", text: "SHOWPASS handled 1200 registrations for our annual fest. The QR check-in on entry day was seamless. Never going back to Google Forms.", avatar: "RV" },
  { name: "Priya Malhotra", role: "Workshop Host, Bangalore", text: "AI wrote my event description in seconds. I just typed 5 bullet points. It looked more professional than anything I could write myself.", avatar: "PM" },
  { name: "DJ Aryan", role: "Artist, Mumbai", text: "₹2.3L in ticket sales for my first headlining show. The real-time revenue dashboard was addictive to watch that night.", avatar: "DA" },
];

export function SocialProof() {
  return (
    <section className="py-24 px-6 bg-navy-700/40 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-clash text-4xl font-bold text-white">Loved by Organisers & Attendees</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-accent/25 transition-all"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-gold-500 text-sm">⭐</span>
                ))}
              </div>
              <p className="text-sm text-white/65 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
