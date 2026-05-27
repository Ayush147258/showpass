"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, Download, Filter, CheckCircle2, Clock, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

interface Attendee {
  id: string; ticketRef: string; attendeeName: string; attendeeEmail: string;
  tierName: string; tierType: string; price: number;
  purchasedAt: string; isCheckedIn: boolean; checkedInAt: string | null;
  eventTitle?: string;
}

interface AttendeeTableProps {
  eventId?: string; // if undefined shows all organiser attendees
}

export function AttendeeTable({ eventId }: AttendeeTableProps) {
  const { data: session } = useSession();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCheckedIn, setFilterCheckedIn] = useState<"all" | "true" | "false">("all");
  const [sort, setSort] = useState<{ col: keyof Attendee; dir: "asc" | "desc" }>({ col: "purchasedAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchAttendees = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filterCheckedIn !== "all") params.set("checkedIn", filterCheckedIn);
      const res = await fetch(`/api/organiser/events/${eventId}/attendees?${params}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAttendees(data.data);
        setTotal(data.total ?? data.data.length);
      } else {
        setAttendees([]);
        setTotal(0);
      }
    } finally { setLoading(false); }
  }, [eventId, page, filterCheckedIn]);

  useEffect(() => { fetchAttendees(); }, [fetchAttendees]);

  const filtered = attendees.filter((a) =>
    search === "" ||
    a.attendeeName.toLowerCase().includes(search.toLowerCase()) ||
    a.attendeeEmail.toLowerCase().includes(search.toLowerCase()) ||
    a.ticketRef.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sort.col] ?? "";
    const bv = b[sort.col] ?? "";
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const SortHeader = ({ col, label }: { col: keyof Attendee; label: string }) => (
    <button
      onClick={() => setSort((s) => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }))}
      className="flex items-center gap-1 text-white/50 hover:text-white transition-colors group"
    >
      {label}
      <span className="opacity-0 group-hover:opacity-100">
        {sort.col === col ? (
          sort.dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : <ChevronDown className="w-3 h-3 text-white/20" />}
      </span>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, ticket ref…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50 transition-all" />
        </div>

        {/* Check-in filter */}
        <div className="flex rounded-xl border border-white/10 overflow-hidden">
          {(["all", "true", "false"] as const).map((v) => (
            <button key={v} onClick={() => setFilterCheckedIn(v)}
              type="button"
              className={cn("px-3 py-2 text-xs font-semibold transition-all",
                filterCheckedIn === v ? "bg-accent text-white" : "text-white/40 hover:text-white hover:bg-white/8"
              )}>
              {v === "all" ? "All" : v === "true" ? "✓ Checked In" : "Pending"}
            </button>
          ))}
        </div>

        {eventId && (
          <a href={`/api/organiser/events/${eventId}/attendees?format=csv`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-all">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-white/35">
        <span>{total} total attendees</span>
        <span>·</span>
        <span className="text-teal-400">
          {attendees.filter((a) => a.isCheckedIn).length} checked in
        </span>
        <span>·</span>
        <span>{attendees.filter((a) => !a.isCheckedIn).length} pending</span>
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/30">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading attendees…
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-12 text-center text-white/25 text-sm">
            {search ? "No attendees match your search" : "No attendees yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    <SortHeader col="attendeeName" label="Attendee" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold hidden sm:table-cell">
                    <SortHeader col="tierName" label="Tier" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold hidden md:table-cell">
                    <SortHeader col="purchasedAt" label="Purchased" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    <SortHeader col="isCheckedIn" label="Status" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold hidden lg:table-cell">
                    Ref
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {sorted.map((a) => (
                  <tr key={a.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{a.attendeeName}</p>
                      <p className="text-xs text-white/35 truncate max-w-[180px]">{a.attendeeEmail}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-semibold",
                        a.tierType === "VIP" ? "bg-purple-500/15 text-purple-300" :
                        a.tierType === "EARLY_BIRD" ? "bg-teal-500/15 text-teal-400" :
                        "bg-white/8 text-white/50"
                      )}>
                        {a.tierName}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-white/40">
                      {formatDateTime(a.purchasedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {a.isCheckedIn ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> In
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-white/30">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-mono text-white/30">{a.ticketRef}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between text-xs text-white/35">
          <span>Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-white/6 disabled:opacity-30 hover:bg-white/10 transition-all">
              Previous
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * LIMIT >= total}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-white/6 disabled:opacity-30 hover:bg-white/10 transition-all">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
