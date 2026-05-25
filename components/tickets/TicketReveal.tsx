"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Download, Share2, X, CheckCircle2 } from "lucide-react";
import { TicketStub } from "./TicketStub";
import type { TicketWithRelations } from "@/types";

interface TicketRevealProps {
  tickets: TicketWithRelations[];
  qrDataUrls: Record<string, string>;
  onClose: () => void;
}

export function TicketReveal({ tickets, qrDataUrls, onClose }: TicketRevealProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Fire confetti burst
    const duration = 2500;
    const end = Date.now() + duration;
    const colors = ["#FF6B35", "#FFB800", "#00D4AA", "#7B2FBE", "#FFFFFF"];

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
        zIndex: 9999,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Central burst
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors,
        startVelocity: 40,
        gravity: 0.9,
        zIndex: 9999,
      });
    }, 300);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      const el = document.getElementById(`ticket-${tickets[activeIdx].id}`);
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 3, canvas.height / 3] });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 3, canvas.height / 3);
      pdf.save(`SHOWPASS_${tickets[activeIdx].ticketRef}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
        style={{ background: "rgba(5, 10, 20, 0.92)", backdropFilter: "blur(20px)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/8 text-white/60 hover:text-white hover:bg-white/15 flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-6 max-w-3xl w-full">
          {/* Success message */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <h2 className="font-clash text-2xl font-bold text-white">You&apos;re in! 🎉</h2>
              <p className="text-white/50 text-sm mt-1">
                {tickets.length} ticket{tickets.length > 1 ? "s" : ""} confirmed. See you there!
              </p>
            </div>
          </motion.div>

          {/* Ticket */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="w-full"
          >
            <TicketStub
              ticket={tickets[activeIdx]}
              qrDataUrl={qrDataUrls[tickets[activeIdx].id] ?? ""}
            />
          </motion.div>

          {/* Multi-ticket nav */}
          {tickets.length > 1 && (
            <div className="flex gap-2">
              {tickets.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? "bg-accent w-6" : "bg-white/20"}`}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-600 transition-all shadow-glow-accent disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Generating PDF…" : "Download PDF"}
            </button>
            <button
              onClick={() => navigator.share?.({ title: "My SHOWPASS Ticket", url: window.location.href })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white font-semibold text-sm hover:bg-white/12 transition-all"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
