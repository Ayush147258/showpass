"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { TicketReveal } from "@/components/tickets/TicketReveal";
import { formatCurrency } from "@/lib/utils";
import { Zap, Tag, X, Loader2, Lock, Ticket, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Script from "next/script";

declare global {
  interface Window { Razorpay: any }
}

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, total, platformFee, clearCart } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (session?.user?.email && !email) setEmail(session.user.email);
  }, [session]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{ discountAmount: number; message: string } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [revealTickets, setRevealTickets] = useState<any[] | null>(null);
  const [revealQRs, setRevealQRs] = useState<Record<string, string>>({});

  const cartItems = items;
  const subtotal = total();
  const fee = platformFee();
  const discount = discountInfo?.discountAmount ?? 0;
  const grandTotal = Math.max(subtotal + fee - discount, 0);

  const validateCode = async () => {
    if (!discountCode.trim() || !cartItems[0]) return;
    setValidatingCode(true);
    try {
      const res = await fetch("/api/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: cartItems[0].eventId,
          code: discountCode.toUpperCase(),
          subtotal: subtotal + fee,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountInfo({ discountAmount: data.discountAmount, message: data.message });
        toast.success(data.message);
      } else {
        toast.error(data.message ?? "Invalid code");
        setDiscountInfo(null);
      }
    } finally {
      setValidatingCode(false);
    }
  };

  const handleCheckout = async () => {
    if (!session?.user) { router.push("/auth?callbackUrl=/checkout"); return; }
    if (!name.trim() || !email.trim()) { toast.error("Please fill in your details"); return; }
    if (cartItems.length === 0) { toast.error("Your cart is empty"); return; }

    setProcessing(true);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: cartItems[0].eventId,
          items: cartItems.map((i) => ({
            tierId: i.tierId,
            quantity: i.quantity,
            attendees: Array(i.quantity).fill({ name, email }),
          })),
          discountCode: discountCode || undefined,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) { toast.error(orderData.error ?? "Order failed"); setProcessing(false); return; }

      // Free order
      if (orderData.data.status === "PAID") {
        await fetchAndShowTickets(orderData.data.orderId);
        return;
      }

      // Razorpay flow
      const { razorpayOrderId, orderId, amount } = orderData.data;
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: razorpayOrderId,
        amount: amount * 100,
        currency: "INR",
        name: "SHOWPASS",
        description: cartItems.map((i) => `${i.tierName} × ${i.quantity}`).join(", "),
        prefill: { name, email },
        theme: { color: "#FF6B35" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/orders/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, orderId }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            await fetchAndShowTickets(orderId);
          } else {
            toast.error("Payment verification failed. Contact support.");
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      });
      rzp.open();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const fetchAndShowTickets = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        const qrMap: Record<string, string> = {};
        data.data.tickets.forEach((t: any) => { qrMap[t.id] = t.qrDataUrl; });
        setRevealTickets(data.data.tickets);
        setRevealQRs(qrMap);
        clearCart();
      }
    } finally {
      setProcessing(false);
    }
  };

  if (cartItems.length === 0 && !revealTickets) {
    return (
      <div className="min-h-screen bg-navy-700">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <ShoppingBag className="w-16 h-16 text-white/10 mb-4" />
          <h2 className="font-clash text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-white/40 mb-6">Find events you love and grab your tickets.</p>
          <Link href="/events" className="btn-primary inline-flex items-center gap-2">
            <Ticket className="w-4 h-4" /> Browse Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-navy-700">
        <Navbar />

        <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
          <h1 className="font-clash text-3xl font-bold text-white mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left — form */}
            <div className="lg:col-span-3 space-y-5">
              {/* Attendee details */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
                <h3 className="font-clash font-bold text-white mb-4">Your Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/40 font-medium mb-1.5 block">Full name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name on the ticket"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-accent/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 font-medium mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ticket confirmation will be sent here"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-accent/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Discount code */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
                <h3 className="font-clash font-bold text-white mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-accent" /> Discount Code
                </h3>
                <div className="flex gap-2">
                  <input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && validateCode()}
                    placeholder="EARLYBIRD25"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-sm font-mono focus:outline-none focus:border-accent/50 transition-all"
                  />
                  {discountInfo ? (
                    <button onClick={() => { setDiscountInfo(null); setDiscountCode(""); }}
                      className="px-4 py-3 rounded-xl bg-white/8 text-white/50 hover:text-white transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={validateCode} disabled={!discountCode.trim() || validatingCode}
                      className="px-5 py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/25 transition-all disabled:opacity-50">
                      {validatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </button>
                  )}
                </div>
                {discountInfo && (
                  <p className="text-xs text-teal-400 mt-2 flex items-center gap-1">
                    ✓ {discountInfo.message}
                  </p>
                )}
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 text-xs text-white/25 px-1">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                Secured by Razorpay · 256-bit SSL encryption · PCI DSS compliant
              </div>
            </div>

            {/* Right — order summary */}
            <div className="lg:col-span-2">
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5 sticky top-20">
                <h3 className="font-clash font-bold text-white mb-4">Order Summary</h3>
                <div className="space-y-2 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.tierId} className="flex justify-between text-sm">
                      <span className="text-white/60 truncate pr-2">{item.tierName} × {item.quantity}</span>
                      <span className="text-white font-medium whitespace-nowrap">
                        {item.price === 0 ? "Free" : formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/8 pt-3 space-y-2">
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                  </div>
                  {subtotal > 0 && (
                    <div className="flex justify-between text-xs text-white/40">
                      <span>Platform fee (3%)</span><span>{formatCurrency(fee)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-teal-400">
                      <span>Discount</span><span>−{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-clash font-bold text-base text-white pt-1 border-t border-white/8">
                    <span>Total</span>
                    <span className="text-accent">{grandTotal === 0 ? "FREE" : formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing || !name.trim() || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 mt-5 py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-600 transition-all shadow-glow-accent disabled:opacity-50"
                >
                  {processing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <><Zap className="w-4 h-4 fill-current" />
                      {grandTotal === 0 ? "Get Free Tickets" : `Pay ${formatCurrency(grandTotal)}`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket reveal modal */}
      {revealTickets && (
        <TicketReveal
          tickets={revealTickets}
          qrDataUrls={revealQRs}
          onClose={() => { setRevealTickets(null); router.push("/my-tickets"); }}
        />
      )}
    </>
  );
}