"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Percent, Plus, TicketPercent, Trash2 } from "lucide-react";

type DiscountCode = {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
};

type Props = {
  eventId: string;
  initialCodes: DiscountCode[];
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent/60";

export function DiscountCodeManager({ eventId, initialCodes }: Props) {
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(() => codes.filter((item) => item.isActive).length, [codes]);

  async function createCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/discount-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          code: code.trim().toUpperCase(),
          type,
          value: Number(value),
          maxUses: Number(maxUses),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to create discount code");

      setCodes((current) => [payload.data, ...current]);
      setCode("");
      setValue("");
      setMaxUses("100");
      setExpiresAt("");
      setType("PERCENT");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create discount code");
    } finally {
      setIsSaving(false);
    }
  }

  async function deactivateCode(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/discount-codes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to deactivate code");

      setCodes((current) =>
        current.map((item) => (item.id === id ? { ...item, isActive: false } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate discount code");
    }
  }

  return (
    <section className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-clash font-bold text-white">Discount Codes</h2>
          <p className="text-xs text-white/35">{activeCount} active codes</p>
        </div>
        <TicketPercent className="h-5 w-5 text-accent" />
      </div>

      <form onSubmit={createCode} className="grid gap-3 p-5 md:grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_1fr_auto]">
        <input
          className={inputClass}
          minLength={3}
          maxLength={20}
          placeholder="CODE"
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <select
          className={inputClass}
          value={type}
          onChange={(event) => setType(event.target.value as "PERCENT" | "FLAT")}
        >
          <option value="PERCENT">Percent</option>
          <option value="FLAT">Flat</option>
        </select>
        <input
          className={inputClass}
          min="1"
          placeholder={type === "PERCENT" ? "10" : "500"}
          required
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <input
          className={inputClass}
          min="1"
          placeholder="Uses"
          required
          type="number"
          value={maxUses}
          onChange={(event) => setMaxUses(event.target.value)}
        />
        <input
          className={inputClass}
          type="datetime-local"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          type="submit"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>

      {error && <p className="px-5 pb-4 text-sm text-red-300">{error}</p>}

      <div className="divide-y divide-white/4">
        {codes.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/25">No discount codes yet</div>
        ) : (
          codes.map((item) => (
            <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-bold text-white">{item.code}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.isActive ? "bg-teal-500/15 text-teal-400" : "bg-white/8 text-white/35"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/35">
                  {item.usedCount}/{item.maxUses} used
                  {item.expiresAt ? ` · expires ${new Date(item.expiresAt).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                {item.type === "PERCENT" ? <Percent className="h-4 w-4" /> : <TicketPercent className="h-4 w-4" />}
                {item.type === "PERCENT" ? `${item.value}%` : `₹${item.value}`}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-white/35">
                <CalendarClock className="h-3.5 w-3.5" />
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/45 transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!item.isActive}
                onClick={() => deactivateCode(item.id)}
                title="Deactivate code"
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
