"use client";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Chrome, Mail, Lock, ArrowRight, Ticket, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { email: "organiser@showpass.demo", role: "Organiser", color: "text-accent", bg: "bg-accent/10 border-accent/25", icon: "🎪" },
  { email: "attendee@showpass.demo",  role: "Attendee",  color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/25", icon: "🎟️" },
  { email: "admin@showpass.demo",     role: "Admin",     color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/25", icon: "🛡️" },
];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading("google");
    await signIn("google", { callbackUrl });
  };

  const handleCredentials = async (e: React.FormEvent, prefillEmail?: string) => {
    e.preventDefault();
    const useEmail = prefillEmail ?? email;
    if (!useEmail) return;

    setLoading(prefillEmail ?? "creds");
    const res = await signIn("credentials", {
      email: useEmail,
      password: prefillEmail ? "password123" : password,
      redirect: false,
    });

    if (res?.ok) {
      toast.success("Welcome to SHOWPASS! ⚡");
      // Route based on demo role
      if (useEmail.includes("organiser")) router.push("/dashboard");
      else if (useEmail.includes("admin")) router.push("/admin");
      else router.push(callbackUrl);
    } else {
      toast.error("Invalid credentials. Try a demo account below.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-navy-700 flex">
      {/* Left — branding panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-mesh-navy" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent/12 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute inset-0 dot-grid opacity-20" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-glow-accent">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-clash font-bold text-2xl text-white">SHOW<span className="text-accent">PASS</span></span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-clash text-5xl font-bold text-white leading-tight">
            Your event.<br />
            <span className="text-gradient-accent">Your crowd.</span><br />
            Your moment.
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            India&apos;s smartest event ticketing platform. AI-powered. QR check-in. Unique tickets every time.
          </p>

          {/* Social proof */}
          <div className="flex gap-6 pt-4">
            {[["12K+", "Events"], ["₹2.3Cr+", "Sold"], ["4.8★", "Rating"]].map(([val, label]) => (
              <div key={label}>
                <p className="font-clash text-2xl font-bold text-white">{val}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Floating ticket card */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm max-w-xs"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono text-accent/70 tracking-widest">⚡ SHOWPASS × NEON RAVE</span>
          </div>
          <p className="font-clash font-bold text-lg text-white mb-2">NH7 Weekender 2025</p>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-white/40">Dec 14, 2025 · Pune</p>
              <p className="text-xs font-semibold text-accent">VIP · ₹3,499</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white p-1">
              <div className="w-full h-full rounded bg-navy-700" style={{
                backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 4px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 4px)",
                backgroundSize: "4px 4px",
              }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-clash font-bold text-xl text-white">SHOW<span className="text-accent">PASS</span></span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="font-clash text-3xl font-bold text-white mb-2">Sign in</h2>
            <p className="text-white/45 text-sm">Access your tickets, events, and dashboard.</p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border border-white/12 bg-white/5 text-white font-semibold hover:bg-white/10 hover:border-white/20 transition-all mb-6 disabled:opacity-50"
          >
            {loading === "google" ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-white/30 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentials} className="space-y-4 mb-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-11 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!!loading || !email}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-600 transition-all shadow-glow-accent/30 hover:shadow-glow-accent disabled:opacity-50"
            >
              {loading === "creds" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><ArrowRight className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div>
            <p className="text-xs text-white/30 font-medium uppercase tracking-widest mb-3">
              🎮 Hackathon demo accounts
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={(e) => handleCredentials(e as any, acc.email)}
                  disabled={!!loading}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.01] disabled:opacity-50 ${acc.bg}`}
                >
                  {loading === acc.email ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <span className="text-base flex-shrink-0">{acc.icon}</span>
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <p className={`text-xs font-bold ${acc.color}`}>{acc.role}</p>
                    <p className="text-xs text-white/40 truncate">{acc.email}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/20 text-center mt-2">Password: password123</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-700" />}>
      <AuthContent />
    </Suspense>
  );
}
