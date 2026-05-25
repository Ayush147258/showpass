"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Zap, ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { label: "Music 🎵", cat: "MUSIC" },
  { label: "Tech 💻", cat: "TECH" },
  { label: "College Fest 🎓", cat: "COLLEGE_FEST" },
  { label: "Comedy 🎭", cat: "COMEDY" },
  { label: "Fitness 🏋️", cat: "FITNESS" },
  { label: "Workshop 📚", cat: "WORKSHOP" },
];

export function HeroSection() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const search = () => {
    if (q.trim()) router.push(`/events?search=${encodeURIComponent(q)}`);
    else router.push("/events");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-navy-700">
      {/* Animated mesh background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-mesh-navy" />
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-purple-500/12 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-[90px] animate-float" style={{ animationDelay: "4s" }} />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/25 bg-accent/8 text-accent text-sm font-semibold mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          India&apos;s Most Exciting Ticketing Platform
          <Zap className="w-3.5 h-3.5 fill-current" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="font-clash text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] mb-6"
        >
          Your Event.
          <br />
          <span className="text-gradient-accent">Your Crowd.</span>
          <br />
          Your Moment.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-lg sm:text-xl text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          From sold-out concerts to college fests — discover, book, and host unforgettable events.
          AI-powered. QR check-in. Unique tickets every time.
        </motion.p>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="max-w-xl mx-auto mb-8"
        >
          <div className="flex items-center gap-2 p-2 bg-white/6 border border-white/12 rounded-2xl backdrop-blur-sm focus-within:border-accent/40 transition-all">
            <Search className="w-4 h-4 text-white/30 ml-2 flex-shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search events, artists, cities…"
              className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm focus:outline-none py-2"
            />
            <button
              onClick={search}
              className="btn-primary flex items-center gap-2 py-2.5 text-sm whitespace-nowrap"
            >
              Find Events <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Category quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex flex-wrap justify-center gap-2 mb-16"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.cat}
              onClick={() => router.push(`/events?category=${cat.cat}`)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-white/65 hover:text-white hover:bg-white/10 hover:border-accent/30 transition-all"
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Social proof numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex flex-wrap justify-center gap-8"
        >
          {[
            { num: "12,400+", label: "Events Hosted" },
            { num: "₹2.3Cr+", label: "Tickets Sold" },
            { num: "4.8 ⭐", label: "Average Rating" },
            { num: "180+", label: "Cities" },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <p className="font-clash text-2xl font-bold text-white">{num}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </section>
  );
}