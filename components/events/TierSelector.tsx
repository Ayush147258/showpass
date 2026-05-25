"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { cn, formatCurrency, TIER_TYPE_LABELS } from "@/lib/utils";
import { Plus, Minus, ShoppingCart, Clock, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { TicketTier, Event } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";

interface TierSelectorProps {
  event: Event;
  tiers: TicketTier[];
}

function useCountdown(target: Date | null) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return remaining;
}

function TierRow({ tier, eventId, eventTitle }: { tier: TicketTier; eventId: string; eventTitle: string }) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.tierId === tier.id);
  const qty = cartItem?.quantity ?? 0;

  const available = tier.capacity - tier.sold;
  const soldOut = available <= 0;
  const lowStock = available > 0 && available <= 10;

  const now = new Date();
  const isEarlyBird = !!(tier.earlyBirdPrice && tier.earlyBirdEndsAt && new Date(tier.earlyBirdEndsAt) > now);
  const effectivePrice = isEarlyBird ? tier.earlyBirdPrice! : tier.price;
  const countdown = useCountdown(isEarlyBird && tier.earlyBirdEndsAt ? new Date(tier.earlyBirdEndsAt) : null);
  const soldPct = tier.capacity > 0 ? (tier.sold / tier.capacity) * 100 : 0;

  const TIER_COLORS: Record<string, string> = {
    VIP: "border-purple-500/30 bg-purple-500/5",
    PREMIUM: "border-gold-500/30 bg-gold-500/5",
    EARLY_BIRD: "border-teal-500/30 bg-teal-500/5",
    FREE: "border-teal-500/20 bg-teal-500/3",
    GENERAL: "border-white/10 bg-white/3",
  };

  const handleAdd = () => {
    if (soldOut) return;
    addItem({
      tierId: tier.id,
      tierName: tier.name,
      tierType: tier.type,
      price: effectivePrice,
      quantity: 1,
      maxQuantity: Math.min(available, 10),
      eventId,
      eventTitle,
    });
    toast.success(`${tier.name} added to cart`, { duration: 1500 });
  };

  return (
    <div className={cn(
      "rounded-2xl border p-4 transition-all duration-200",
      soldOut ? "opacity-50 border-white/6 bg-white/2" : TIER_COLORS[tier.type] ?? TIER_COLORS.GENERAL,
      !soldOut && "hover:border-accent/30"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Tier name + badge */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-white text-sm">{tier.name}</span>
            {tier.type === "VIP" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                VIP
              </span>
            )}
            {tier.type === "PREMIUM" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-500 border border-gold-500/30">
                ✨ PREMIUM
              </span>
            )}
            {isEarlyBird && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {countdown}
              </span>
            )}
            {lowStock && !soldOut && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse">
                🔥 Only {available} left
              </span>
            )}
          </div>

          {/* Description */}
          {tier.description && (
            <p className="text-xs text-white/45 mb-2 leading-relaxed">{tier.description}</p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className={cn("font-clash font-bold text-lg", tier.type === "FREE" ? "text-teal-400" : "text-white")}>
              {effectivePrice === 0 ? "FREE" : formatCurrency(effectivePrice)}
            </span>
            {isEarlyBird && (
              <span className="text-sm text-white/30 line-through">{formatCurrency(tier.price)}</span>
            )}
          </div>

          {/* Sold bar */}
          {tier.capacity > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-white/8 rounded-full overflow-hidden w-32">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(soldPct, 100)}%`,
                    background: soldPct > 80 ? "#EF4444" : soldPct > 50 ? "#FFB800" : "#00D4AA",
                  }}
                />
              </div>
              <p className="text-[10px] text-white/25 mt-0.5">
                {soldOut ? "Sold out" : `${available} of ${tier.capacity} available`}
              </p>
            </div>
          )}
        </div>

        {/* Quantity control */}
        {!soldOut ? (
          qty > 0 ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => updateQuantity(tier.id, qty - 1)}
                className="w-8 h-8 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center text-white hover:bg-white/15 transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <motion.span
                key={qty}
                initial={{ scale: 1.3, color: "#FF6B35" }}
                animate={{ scale: 1, color: "#FFFFFF" }}
                className="w-6 text-center font-bold text-sm"
              >
                {qty}
              </motion.span>
              <button
                onClick={() => qty < Math.min(available, 10) && updateQuantity(tier.id, qty + 1)}
                disabled={qty >= Math.min(available, 10)}
                className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white hover:bg-accent-600 transition-all disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-600 transition-all shadow-glow-accent/20 hover:shadow-glow-accent/40 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )
        ) : (
          <span className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 text-white/30 text-sm font-semibold">
            Sold Out
          </span>
        )}
      </div>
    </div>
  );
}

export function TierSelector({ event, tiers }: TierSelectorProps) {
  const { items, total, platformFee, itemCount } = useCart();
  const count = itemCount();
  const cartTotal = total();
  const fee = platformFee();
  const eventItems = items.filter((i) => i.eventId === event.id);

  return (
    <div className="space-y-3">
      {tiers.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-6">No ticket tiers available.</p>
      ) : (
        tiers.map((tier) => (
          <TierRow key={tier.id} tier={tier} eventId={event.id} eventTitle={event.title} />
        ))
      )}

      {/* Cart summary */}
      <AnimatePresence>
        {eventItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 bg-white/4 border border-white/10 rounded-2xl space-y-3"
          >
            {/* Line items */}
            {eventItems.map((item) => (
              <div key={item.tierId} className="flex justify-between text-sm">
                <span className="text-white/60">{item.tierName} × {item.quantity}</span>
                <span className="text-white font-medium">
                  {item.price === 0 ? "FREE" : formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}

            {cartTotal > 0 && (
              <>
                <div className="flex justify-between text-xs text-white/40 border-t border-white/8 pt-2">
                  <span>Platform fee (3%)</span>
                  <span>{formatCurrency(fee)}</span>
                </div>
                <div className="flex justify-between font-clash font-bold text-white text-base">
                  <span>Total</span>
                  <span className="text-accent">{formatCurrency(cartTotal + fee)}</span>
                </div>
              </>
            )}

            <a
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-600 transition-all shadow-glow-accent"
            >
              <ShoppingCart className="w-4 h-4" />
              Checkout {count > 0 && `(${count} ticket${count > 1 ? "s" : ""})`}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
