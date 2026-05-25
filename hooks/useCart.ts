"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, TicketTierType } from "@/types";

interface CartStore {
  items: CartItem[];
  eventId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (tierId: string) => void;
  updateQuantity: (tierId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  platformFee: () => number;
  itemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      eventId: null,

      addItem: (item) => {
        const { items, eventId } = get();
        if (eventId && eventId !== item.eventId) {
          set({ items: [item], eventId: item.eventId });
          return;
        }
        const existing = items.find((i) => i.tierId === item.tierId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.tierId === item.tierId
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxQuantity) }
                : i
            ),
          });
        } else {
          set({ items: [...items, item], eventId: item.eventId });
        }
      },

      removeItem: (tierId) =>
        set((state) => ({
          items: state.items.filter((i) => i.tierId !== tierId),
          eventId: state.items.length <= 1 ? null : state.eventId,
        })),

      updateQuantity: (tierId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(tierId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.tierId === tierId ? { ...i, quantity: Math.min(quantity, i.maxQuantity) } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], eventId: null }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      platformFee: () => {
        const t = get().total();
        return t > 0 ? Math.round(t * 0.03 * 100) / 100 : 0;
      },

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "showpass-cart",
      partialize: (state) => ({ items: state.items, eventId: state.eventId }),
    },
  ),
);
