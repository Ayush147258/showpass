"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Plus, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

// ── EventActionButtons ────────────────────────────────────────────────
export function EventActionButtons({ event }: { event: { id: string; slug: string; isPublished: boolean } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !event.isPublished }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(event.isPublished ? "Event unpublished" : "Event is now live! 🎉");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to update");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50",
        event.isPublished
          ? "bg-white/6 border border-white/12 text-white/60 hover:text-white hover:bg-white/10"
          : "bg-accent text-white hover:bg-accent-600 shadow-glow-accent/30"
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : event.isPublished ? (
        <><EyeOff className="w-4 h-4" /> Unpublish</>
      ) : (
        <><Eye className="w-4 h-4" /> Publish Event</>
      )}
    </button>
  );
}

export function MyPostedEventActions({ event }: { event: { id: string; slug: string; isPublished: boolean } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    if (!window.confirm("Remove this event from public listings?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.slug}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Event removed from public listings");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to remove event");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/events/${event.slug}`}
        className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/6 border border-white/10 text-white/60 hover:text-white transition-all"
      >
        <Eye className="w-3 h-3" /> View
      </a>
      <button
        type="button"
        onClick={remove}
        disabled={loading}
        className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/18 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        Delete
      </button>
    </div>
  );
}

// ── DiscountCodeManager ───────────────────────────────────────────────
interface Code {
  id: string; code: string; type: string; value: number;
  maxUses: number; usedCount: number; isActive: boolean; expiresAt: string | null;
}

export function DiscountCodeManager({ eventId, initialCodes }: {
  eventId: string; initialCodes: Code[];
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", type: "PERCENT", value: 10, maxUses: 100 });
  const [creating, setCreating] = useState(false);

  const createCode = async () => {
    if (!form.code.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/discount-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...form, code: form.code.toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setCodes((c) => [data.data, ...c]);
        setForm({ code: "", type: "PERCENT", value: 10, maxUses: 100 });
        setShowForm(false);
        toast.success("Discount code created!");
      } else {
        toast.error(data.error ?? "Failed");
      }
    } finally { setCreating(false); }
  };

  const deactivate = async (id: string) => {
    const res = await fetch(`/api/discount-codes?id=${id}`, { method: "DELETE" });
    if ((await res.json()).success) {
      setCodes((c) => c.filter((code) => code.id !== id));
      toast.success("Code deactivated");
    }
  };

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-accent" />
          <h2 className="font-clash font-bold text-white">Discount Codes</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent/12 border border-accent/25 text-accent hover:bg-accent/20 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add Code
        </button>
      </div>

      {showForm && (
        <div className="px-5 py-4 border-b border-white/6 bg-white/2 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">Code</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="EARLYBIRD25" className="sp-input text-xs font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="sp-input text-xs">
                <option value="PERCENT">Percent %</option>
                <option value="FLAT">Flat ₹</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">
                {form.type === "PERCENT" ? "Discount %" : "Amount ₹"}
              </label>
              <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: +e.target.value }))}
                className="sp-input text-xs" min="1" />
            </div>
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">Max Uses</label>
              <input type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: +e.target.value }))}
                className="sp-input text-xs" min="1" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createCode} disabled={creating || !form.code.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-600 transition-all disabled:opacity-50">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-white/6 border border-white/10 text-white/50 text-xs font-semibold hover:text-white transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {codes.length === 0 ? (
        <div className="py-8 text-center text-white/25 text-sm">No discount codes yet</div>
      ) : (
        <div className="divide-y divide-white/4">
          {codes.map((code) => (
            <div key={code.id} className="flex items-center gap-3 px-5 py-3">
              <span className="font-mono text-sm font-bold text-accent">{code.code}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/50">
                {code.type === "PERCENT" ? `${code.value}% off` : `₹${code.value} off`}
              </span>
              <span className="text-xs text-white/30">{code.usedCount}/{code.maxUses} used</span>
              <button onClick={() => deactivate(code.id)}
                className="ml-auto text-red-400/40 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
