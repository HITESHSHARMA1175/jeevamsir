"use client";

// ============================================
// FILE: app/checkout/page.tsx
// PURPOSE: Checkout page (collect details + pay with Razorpay)
// USED IN: Cart → checkout
// INTERN NOTE: Payment uses Razorpay test/live keys from env.
// ============================================

import * as React from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/utils/store/formatPrice";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { buildCartOrderMessage, buildWhatsAppUrl } from "@/utils/store/whatsapp";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
};

type CreateOrderResponse = {
  keyId: string | null;
  razorpayOrderId: string | null;
  amount: number;
  currency: string;
  orderId: string;
  paymentMethod?: "cod" | "razorpay" | "phonepe";
  subtotal?: number;
  discount?: number;
  total?: number;
  error?: string;
  code?: string;
};

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [hasSession, setHasSession] = React.useState(false);
  const [storePhone, setStorePhone] = React.useState<string | null>(null);
  const [razorpayAvailable, setRazorpayAvailable] = React.useState(true);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [alternatePhone, setAlternatePhone] = React.useState("");
  const [addressLine, setAddressLine] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [pincode, setPincode] = React.useState("");
  const [landmark, setLandmark] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<"cod" | "razorpay" | "phonepe">("cod");
  const [couponCode, setCouponCode] = React.useState("");
  const [couponMessage, setCouponMessage] = React.useState<string | null>(null);
  const [discount, setDiscount] = React.useState(0);
  const [payable, setPayable] = React.useState(cart.totalPrice);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const total = formatINR(cart.totalPrice);
  const finalTotal = formatINR(payable);

  React.useEffect(() => {
    setPayable(Math.max(0, cart.totalPrice - discount));
  }, [cart.totalPrice, discount]);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    // Needed for WhatsApp fallback when Razorpay isn't configured.
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("site_settings")
          .select("whatsapp")
          .limit(1)
          .maybeSingle();
        const w = typeof data?.whatsapp === "string" ? data.whatsapp : null;
        if (!cancelled) setStorePhone(w);
      } catch {
        if (!cancelled) setStorePhone(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function applyCoupon() {
    setCouponMessage(null);
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          items: cart.items.map((item) => ({ id: item.id, qty: item.qty })),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        discount?: number;
        total?: number;
      };
      if (!res.ok || !data.ok) {
        setDiscount(0);
        setCouponMessage(data.message || data.error || "Coupon not applied");
        return;
      }
      setDiscount(Number(data.discount ?? 0));
      setPayable(Number(data.total ?? cart.totalPrice));
      setCouponMessage(data.message || "Coupon applied");
    } catch (error) {
      setCouponMessage(error instanceof Error ? error.message : "Coupon failed");
    }
  }

  async function startPayment() {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: {
            name,
            phone,
            email,
            alternatePhone,
            addressLine,
            city,
            state,
            pincode,
            landmark,
          },
          items: cart.items.map((item) => ({
            id: item.id,
            qty: item.qty,
            selected_options: item.selected_options,
          })),
          couponCode,
          paymentMethod,
        }),
      });
      const data = (await res.json()) as CreateOrderResponse;
      if (!res.ok) {
        if (data?.code === "RAZORPAY_NOT_CONFIGURED") {
          setRazorpayAvailable(false);
        }
        throw new Error(data.error || "Failed to create order");
      }

      if (data.paymentMethod === "cod") {
        cart.clearCart();
        setMessage("Order placed successfully. Pay cash on delivery.");
        router.refresh();
        return;
      }

      if (!data.razorpayOrderId || !data.keyId) throw new Error("Payment order missing");

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded yet");
      }

      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart order payment",
        order_id: data.razorpayOrderId,
        prefill: {
          name,
          email,
          contact: phone,
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verify = (await verifyRes.json()) as { ok: boolean; error?: string };
            if (!verify.ok) {
              throw new Error(verify.error || "Payment verified failed");
            }
            cart.clearCart();
            setMessage("Payment successful. Your order is confirmed!");
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: "#111827" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isCartEmpty = cart.items.length === 0;
  const waMessage = buildCartOrderMessage(cart.items, total);
  const waHref = storePhone ? buildWhatsAppUrl(storePhone, waMessage) : null;

  return (
    <main className="container-pad section-pad max-w-2xl">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">Checkout</h1>
      <p className="mt-2 text-sm text-slate-600">
        {razorpayAvailable
           ? "Choose your spiritual payment method and enter delivery details."
           : "Cash on delivery or WhatsApp ordering available for spiritual essentials."}{" "}
        Your cart total is <span className="font-semibold text-[var(--brand-primary)]">{total}</span>.
      </p>

      {isCartEmpty && (
        <div className="mt-4 rounded-[1.2rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-sm">
          <div className="font-semibold text-slate-950">Your cart is empty</div>
          <div className="mt-1 text-slate-600">
            Add at least one product to continue to payment.
          </div>
          <div className="mt-4">
            <Button asChild className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90">
              <Link href="/">Continue shopping</Link>
            </Button>
          </div>
        </div>
      )}

      {!hasSession && (
        <div className="mt-4 rounded-[1.2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/50 p-5 text-sm">
          <div className="font-semibold text-slate-950">Track Your Orders</div>
          <div className="mt-1 text-slate-600">
            Create an account with the same email to track orders in{" "}
            <Link href="/account" className="font-semibold text-[var(--brand-primary)] underline underline-offset-2">
              My Account
            </Link>
            .
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="border-amber-100 hover:bg-amber-50">
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      )}

      <Separator className="my-6" />

      <div className="space-y-5 mt-6">
        <div className="rounded-[1.2rem] border border-amber-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-950">Delivery details</div>
          <div className="mt-4 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="91XXXXXXXXXX" className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email (optional)</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-700">Address line</Label>
              <Input id="address" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="House, street, area" className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-semibold text-slate-700">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-xs font-semibold text-slate-700">State</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-xs font-semibold text-slate-700">Pincode</Label>
                <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternatePhone" className="text-xs font-semibold text-slate-700">Alternate phone</Label>
                <Input id="alternatePhone" value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)} className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark" className="text-xs font-semibold text-slate-700">Landmark</Label>
              <Input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
            </div>
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-amber-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-950">Promo code</div>
          <div className="mt-4 flex gap-2">
            <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="SAVE10" className="rounded-[0.75rem] border-amber-200 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
            <Button type="button" className="rounded-[0.75rem] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white" onClick={applyCoupon} disabled={!couponCode.trim() || isCartEmpty}>
              Apply
            </Button>
          </div>
          {couponMessage && <div className="mt-2 text-xs text-slate-600">{couponMessage}</div>}
        </div>

        <div className="rounded-[1.2rem] border border-amber-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-950">Payment method</div>
          <div className="mt-4 grid gap-2">
            {(["cod", "razorpay", "phonepe"] as const).map((method) => (
              <label key={method} className="flex items-center gap-3 rounded-[0.75rem] border border-amber-100 bg-white hover:bg-amber-50 p-3 text-sm transition-colors cursor-pointer">
                <input
                  type="radio"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                  disabled={method === "phonepe"}
                  className="w-4 h-4"
                />
                <span className="font-medium text-slate-950">
                  {method === "cod" ? "Cash on delivery" : method === "razorpay" ? "Razorpay" : "PhonePe (coming soon)"}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-amber-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-700"><span>Subtotal</span><span className="font-medium">{formatINR(cart.totalPrice)}</span></div>
            <div className="flex justify-between text-emerald-700"><span>Discount</span><span className="font-medium">-{formatINR(discount)}</span></div>
            <div className="flex justify-between text-base font-semibold text-slate-950 border-t border-amber-100 pt-2"><span>Total</span><span className="text-[var(--brand-primary)]">{finalTotal}</span></div>
          </div>
        </div>

        {message && (
          <div className="rounded-[1.2rem] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            {message}
          </div>
        )}

        <Button
          type="button"
          className="w-full h-12 rounded-[0.75rem] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-base"
          disabled={loading || isCartEmpty || (paymentMethod === "razorpay" && !razorpayAvailable)}
          onClick={startPayment}
        >
          {loading
            ? "Placing order..."
            : paymentMethod === "cod"
              ? `Place COD order ${finalTotal}`
              : paymentMethod === "razorpay" && razorpayAvailable
                ? `Pay ${finalTotal}`
                : "Payment not available"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-[0.75rem] border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] font-semibold hover:bg-amber-50"
          disabled={isCartEmpty || !waHref}
          onClick={() => {
            if (!waHref) return;
            window.open(waHref, "_blank", "noreferrer");
          }}
        >
          Order on WhatsApp
        </Button>
      </div>
    </main>
  );
}

