"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, CheckCircle2, XCircle, Users, TrendingUp, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface CheckIn {
  id: string;
  attendeeName: string;
  tierName: string;
  checkedInAt: string;
}

interface CheckInPanelProps {
  eventId: string;
  eventTitle: string;
  totalRegistered: number;
  initialCheckedIn: number;
}

export function CheckInPanel({ eventId, eventTitle, totalRegistered, initialCheckedIn }: CheckInPanelProps) {
  const [qrInput, setQrInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [lastResult, setLastResult] = useState<"success" | "error" | "duplicate" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async () => {
    const token = qrInput.trim();
    if (!token) return;

    setScanning(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/tickets/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token, eventId }),
      });
      const data = await res.json();

      if (data.success) {
        setLastResult("success");
        setCheckedIn((c) => c + 1);
        setRecentCheckIns((prev) => [
          { id: data.ticket.id, attendeeName: data.ticket.attendeeName, tierName: data.ticket.tierName, checkedInAt: new Date().toISOString() },
          ...prev.slice(0, 49),
        ]);
        toast.success(`✅ ${data.ticket.attendeeName} checked in!`, { description: data.ticket.tierName });
      } else if (data.error === "ALREADY_CHECKED_IN") {
        setLastResult("duplicate");
        toast.warning("Already checked in", { description: "This ticket was already used." });
      } else {
        setLastResult("error");
        toast.error("Invalid ticket", { description: "QR code not recognised." });
      }
    } catch {
      setLastResult("error");
      toast.error("Network error. Try again.");
    } finally {
      setScanning(false);
      setQrInput("");
      inputRef.current?.focus();
    }
  };

  const pct = totalRegistered > 0 ? Math.min((checkedIn / totalRegistered) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scanner panel */}
      <div className="lg:col-span-1 space-y-4">
        {/* Stats */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Check-in Progress</p>
            <span className="text-xs text-white/40">{pct.toFixed(1)}%</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-clash text-4xl font-bold text-white">{checkedIn}</span>
            <span className="text-white/40 text-lg">/ {totalRegistered}</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #00D4AA, #FF6B35)" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* QR Input */}
        <div className={cn(
          "bg-white/3 border rounded-2xl p-5 transition-all duration-300",
          lastResult === "success" ? "border-teal-500/50 bg-teal-500/5" :
          lastResult === "error" ? "border-red-500/50 bg-red-500/5" :
          lastResult === "duplicate" ? "border-gold-500/50 bg-gold-500/5" :
          "border-white/8"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <ScanLine className="w-4 h-4 text-accent" />
            <p className="text-sm font-semibold text-white">QR Scanner</p>
          </div>

          <div className="relative mb-3">
            <input
              ref={inputRef}
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Paste QR code or scan…"
              className="w-full px-4 py-3 bg-black/20 border border-white/12 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50 font-mono"
            />
          </div>

          <button
            onClick={handleScan}
            disabled={!qrInput.trim() || scanning}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-600 transition-all disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {scanning ? "Verifying…" : "Verify Ticket"}
          </button>

          {/* Result flash */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold",
                  lastResult === "success" && "bg-teal-500/15 text-teal-400",
                  lastResult === "error" && "bg-red-500/15 text-red-400",
                  lastResult === "duplicate" && "bg-gold-500/15 text-gold-500",
                )}>
                  {lastResult === "success" && <><CheckCircle2 className="w-4 h-4" /> Valid ticket — checked in!</>}
                  {lastResult === "error" && <><XCircle className="w-4 h-4" /> Invalid ticket</>}
                  {lastResult === "duplicate" && <><XCircle className="w-4 h-4" /> Already checked in</>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Live feed */}
      <div className="lg:col-span-2">
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <p className="text-sm font-semibold text-white">Live Check-in Feed</p>
            </div>
            <span className="text-xs text-white/40">{recentCheckIns.length} scanned this session</span>
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/25">
              <Users className="w-8 h-8 mb-2" />
              <p className="text-sm">No check-ins yet. Start scanning!</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[420px]">
              <AnimatePresence>
                {recentCheckIns.map((ci, i) => (
                  <motion.div
                    key={ci.id + i}
                    initial={{ opacity: 0, x: -20, background: "rgba(0,212,170,0.1)" }}
                    animate={{ opacity: 1, x: 0, background: "rgba(0,0,0,0)" }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3 px-5 py-3 border-b border-white/4 last:border-0 hover:bg-white/2"
                  >
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{ci.attendeeName}</p>
                      <p className="text-xs text-white/40">{ci.tierName}</p>
                    </div>
                    <p className="text-xs text-white/30 font-mono flex-shrink-0">
                      {new Date(ci.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
