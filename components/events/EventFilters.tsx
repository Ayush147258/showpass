"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { cn, EVENT_CATEGORY_LABELS } from "@/lib/utils";

const CITIES = ["Mumbai","Delhi","Bangalore","Hyderabad","Pune","Chennai","Kolkata","Lucknow","Jaipur","Ahmedabad","Chandigarh","Kochi","Goa","Indore","Bhopal"];
const PRICE_RANGES = [
  { label: "Free", value: "free" },
  { label: "Under ₹500", value: "0-500" },
  { label: "₹500–₹1,500", value: "500-1500" },
  { label: "₹1,500–₹5,000", value: "1500-5000" },
  { label: "₹5,000+", value: "5000-999999" },
];

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const current = {
    category: searchParams.get("category") ?? "",
    city: searchParams.get("city") ?? "",
    price: searchParams.get("price") ?? "",
    search: searchParams.get("search") ?? "",
  };

  const activeCount = [current.category, current.city, current.price].filter(Boolean).length;

  const push = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.delete("page");
    router.push(`/events?${params.toString()}`);
  }, [router, searchParams]);

  const clearAll = () => router.push("/events");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    push({ search });
  };

  return (
    <div className="space-y-4">
      {/* Search bar + filter toggle row */}
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, artists, cities…"
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-accent/50 transition-all"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); push({ search: "" }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all",
            open || activeCount > 0
              ? "bg-accent/15 border-accent/35 text-accent"
              : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/8"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 text-sm transition-all">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Category quick pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <FilterPill
          label="All"
          active={!current.category}
          onClick={() => push({ category: "" })}
        />
        {Object.entries(EVENT_CATEGORY_LABELS).map(([val, label]) => (
          <FilterPill
            key={val}
            label={label}
            active={current.category === val}
            onClick={() => push({ category: current.category === val ? "" : val })}
          />
        ))}
      </div>

      {/* Expanded filter panel */}
      {open && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* City */}
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2.5">City</p>
              <div className="relative">
                <select
                  value={current.city}
                  onChange={(e) => push({ city: e.target.value })}
                  className="w-full appearance-none px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-accent/50 cursor-pointer"
                >
                  <option value="">Any city</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Price range */}
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2.5">Price Range</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PRICE_RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => push({ price: current.price === r.value ? "" : r.value })}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                      current.price === r.value
                        ? "bg-accent/20 border border-accent/35 text-accent"
                        : "bg-white/4 border border-white/8 text-white/60 hover:text-white hover:bg-white/8"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/6">
              <span className="text-xs text-white/30 self-center">Active:</span>
              {current.category && (
                <Chip label={EVENT_CATEGORY_LABELS[current.category] ?? current.category}
                  onRemove={() => push({ category: "" })} />
              )}
              {current.city && <Chip label={current.city} onRemove={() => push({ city: "" })} />}
              {current.price && (
                <Chip label={PRICE_RANGES.find((r) => r.value === current.price)?.label ?? current.price}
                  onRemove={() => push({ price: "" })} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
        active
          ? "bg-accent text-white shadow-glow-accent/30"
          : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/8"
      )}
    >
      {label}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
    </span>
  );
}
