"use client";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Star, StarOff, Eye, Loader2, Search, Filter } from "lucide-react";
import { cn, formatDate, formatCurrency, EVENT_CATEGORY_LABELS } from "@/lib/utils";
import Link from "next/link";

interface Event {
  id: string; title: string; slug: string; category: string;
  city: string; startAt: string; isPublished: boolean; isFeatured: boolean;
  totalRevenue: number; totalSold: number; totalCapacity: number;
  organiser: { name: string | null; email: string | null };
}

interface EventApprovalTableProps {
  initialEvents: Event[];
  platformStats: {
    totalEvents: number; publishedEvents: number; featuredEvents: number;
    totalRevenue: number; platformEarnings: number; totalOrders: number;
    totalUsers: number; totalTickets: number;
  };
}

export function EventApprovalTable({ initialEvents, platformStats }: EventApprovalTableProps) {
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "unpublished" | "featured">("all");

  const filtered = events.filter((e) => {
    const matchSearch =
      search === "" ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.organiser.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "published" && e.isPublished) ||
      (filter === "unpublished" && !e.isPublished) ||
      (filter === "featured" && e.isFeatured);
    return matchSearch && matchFilter;
  });

  const doAction = async (eventId: string, action: string, reason?: string) => {
    setLoading(eventId + action);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((evs) =>
          evs.map((e) => {
            if (e.id !== eventId) return e;
            if (action === "approve") return { ...e, isPublished: true };
            if (action === "reject" || action === "unpublish") return { ...e, isPublished: false, isFeatured: false };
            if (action === "feature") return { ...e, isFeatured: true, isPublished: true };
            if (action === "unfeature") return { ...e, isFeatured: false };
            return e;
          })
        );
        toast.success(`Event ${action}d successfully`);
      } else {
        toast.error(data.error ?? "Action failed");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: platformStats.totalEvents, color: "text-white" },
          { label: "Published", value: platformStats.publishedEvents, color: "text-teal-400" },
          { label: "Platform Earnings", value: formatCurrency(platformStats.platformEarnings), color: "text-accent" },
          { label: "Total Users", value: platformStats.totalUsers.toLocaleString("en-IN"), color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <p className={`font-clash font-bold text-xl ${color}`}>{value}</p>
            <p className="text-xs text-white/35 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, organisers, cities…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
        <div className="flex rounded-xl border border-white/10 overflow-hidden">
          {(["all", "published", "unpublished", "featured"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-2 text-xs font-semibold capitalize transition-all",
                filter === f ? "bg-accent text-white" : "text-white/40 hover:text-white hover:bg-white/8"
              )}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30">{filtered.length} events</p>

      {/* Table */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6 text-xs text-white/40 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Organiser</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Revenue</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              <AnimatePresence>
                {filtered.map((event) => (
                  <motion.tr
                    key={event.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-base flex-shrink-0">
                          {EVENT_CATEGORY_LABELS[event.category]?.split(" ")[0] ?? "🎟️"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[200px]">{event.title}</p>
                          <p className="text-xs text-white/35">{event.city} · {EVENT_CATEGORY_LABELS[event.category]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-white/70 text-xs truncate max-w-[140px]">{event.organiser.name}</p>
                      <p className="text-white/30 text-xs truncate max-w-[140px]">{event.organiser.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-white/60 text-xs">{formatDate(event.startAt)}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-accent text-xs font-semibold">{formatCurrency(event.totalRevenue)}</p>
                      <p className="text-white/30 text-xs">{event.totalSold}/{event.totalCapacity} tickets</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full w-fit",
                          event.isPublished
                            ? "bg-teal-500/15 text-teal-400 border border-teal-500/20"
                            : "bg-white/8 text-white/40 border border-white/10"
                        )}>
                          {event.isPublished ? "Live" : "Draft"}
                        </span>
                        {event.isFeatured && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-500 border border-gold-500/20 w-fit">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Approve */}
                        {!event.isPublished && (
                          <ActionBtn
                            onClick={() => doAction(event.id, "approve")}
                            loading={loading === event.id + "approve"}
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            label="Approve"
                            color="bg-teal-500/15 border-teal-500/25 text-teal-400 hover:bg-teal-500/25"
                          />
                        )}
                        {/* Feature / Unfeature */}
                        {event.isPublished && !event.isFeatured && (
                          <ActionBtn
                            onClick={() => doAction(event.id, "feature")}
                            loading={loading === event.id + "feature"}
                            icon={<Star className="w-3.5 h-3.5" />}
                            label="Feature"
                            color="bg-gold-500/15 border-gold-500/25 text-gold-500 hover:bg-gold-500/25"
                          />
                        )}
                        {event.isFeatured && (
                          <ActionBtn
                            onClick={() => doAction(event.id, "unfeature")}
                            loading={loading === event.id + "unfeature"}
                            icon={<StarOff className="w-3.5 h-3.5" />}
                            label="Unfeature"
                            color="bg-white/6 border-white/12 text-white/50 hover:bg-white/10"
                          />
                        )}
                        {/* Reject / Unpublish */}
                        {event.isPublished && (
                          <ActionBtn
                            onClick={() => doAction(event.id, "unpublish")}
                            loading={loading === event.id + "unpublish"}
                            icon={<XCircle className="w-3.5 h-3.5" />}
                            label="Unpublish"
                            color="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                          />
                        )}
                        {/* View */}
                        <Link href={`/events/${event.slug}`} target="_blank"
                          className="w-7 h-7 rounded-lg border bg-white/6 border-white/12 text-white/40 hover:text-white flex items-center justify-center transition-all">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, loading, icon, label, color }: {
  onClick: () => void; loading: boolean;
  icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <button onClick={onClick} disabled={loading} title={label}
      className={cn("w-7 h-7 rounded-lg border flex items-center justify-center transition-all disabled:opacity-40", color)}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
    </button>
  );
}
