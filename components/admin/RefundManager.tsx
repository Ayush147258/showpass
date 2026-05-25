"use client";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Clock } from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RefundRequest {
  id: string; status: string; reason: string; createdAt: string;
  order: {
    id: string; totalAmount: number;
    buyer: { name: string | null; email: string | null };
    event: { title: string; slug: string };
  };
}

export function RefundManager({ initialRefunds, pendingCount }: {
  initialRefunds: RefundRequest[];
  pendingCount: number;
}) {
  const [refunds, setRefunds] = useState(initialRefunds);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = refunds.filter((r) => r.status === filter);

  const act = async (id: string, action: "approve" | "reject", reason?: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/refunds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setRefunds((rs) =>
          rs.map((r) => r.id === id ? { ...r, status: action === "approve" ? "APPROVED" : "REJECTED" } : r)
        );
        toast.success(`Refund ${action}d`);
        setRejectingId(null);
        setRejectReason("");
      } else {
        toast.error(data.error ?? "Action failed");
      }
    } finally { setLoading(null); }
  };

  return (
    <div className="space-y-5">
      {/* Tab filter */}
      <div className="flex rounded-xl border border-white/10 overflow-hidden w-fit">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("px-4 py-2 text-xs font-semibold transition-all flex items-center gap-1.5",
              filter === s ? "bg-accent text-white" : "text-white/40 hover:text-white hover:bg-white/8"
            )}>
            {s === "PENDING" && pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center bg-white/3 border border-white/8 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-white/15 mx-auto mb-2" />
          <p className="text-white/30 text-sm">No {filter.toLowerCase()} refund requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((refund) => (
              <motion.div
                key={refund.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white">{refund.order.buyer.name}</p>
                        <StatusBadge status={refund.status} />
                      </div>
                      <p className="text-xs text-white/40">{refund.order.buyer.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-clash font-bold text-lg text-accent">
                        {formatCurrency(refund.order.totalAmount)}
                      </p>
                      <p className="text-xs text-white/35">{refund.order.event.title}</p>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-3 mb-4">
                    <p className="text-xs text-white/35 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Reason · {formatDateTime(refund.createdAt)}
                    </p>
                    <p className="text-sm text-white/60 leading-relaxed">{refund.reason}</p>
                  </div>

                  {/* Reject reason input */}
                  <AnimatePresence>
                    {rejectingId === refund.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4"
                      >
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection (visible to customer)…"
                          rows={2}
                          className="w-full px-3 py-2.5 bg-red-500/8 border border-red-500/20 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/40 resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {refund.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(refund.id, "approve")}
                        disabled={!!loading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 text-xs font-bold hover:bg-teal-500/25 transition-all disabled:opacity-40"
                      >
                        {loading === refund.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Approve Refund
                      </button>

                      {rejectingId === refund.id ? (
                        <>
                          <button
                            onClick={() => act(refund.id, "reject", rejectReason)}
                            disabled={!!loading || !rejectReason.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-all disabled:opacity-40"
                          >
                            {loading === refund.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Confirm Reject
                          </button>
                          <button onClick={() => { setRejectingId(null); setRejectReason(""); }}
                            className="px-4 py-2 rounded-xl bg-white/6 border border-white/10 text-white/40 text-xs font-semibold hover:text-white transition-all">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setRejectingId(refund.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/6 border border-white/10 text-white/50 text-xs font-semibold hover:text-white transition-all">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-gold-500/15 text-gold-500 border-gold-500/25",
    APPROVED: "bg-teal-500/15 text-teal-400 border-teal-500/25",
    REJECTED: "bg-red-500/15 text-red-400 border-red-500/25",
  };
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", map[status] ?? map.PENDING)}>
      {status}
    </span>
  );
}
