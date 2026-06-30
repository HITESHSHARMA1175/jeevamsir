"use client";

// ============================================
// FILE: app/checkout/CheckoutForm.tsx
// PURPOSE: WhatsApp-only checkout client form — delivery details + cart summary + WhatsApp redirect
// ============================================

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/utils/store/formatPrice";
import Link from "next/link";
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  validateCheckoutForm,
} from "@/utils/store/whatsapp";
import type { CheckoutFormState, FormValidation } from "@/utils/store/whatsapp";

type Props = {
  storePhone: string | null;
};

export default function CheckoutForm({ storePhone: initialPhone }: Props) {
  const cart = useCart();
  const [storePhone, setStorePhone] = React.useState<string | null>(initialPhone);

  // If server didn't provide phone, try fetching client-side as fallback
  React.useEffect(() => {
    if (initialPhone) return; // Already have it from server
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("site_settings")
          .select("whatsapp")
          .limit(1)
          .maybeSingle();
        const w = typeof data?.whatsapp === "string" ? data.whatsapp.trim() : null;
        if (!cancelled && w) setStorePhone(w);
      } catch {
        // silently fail — button click will show error
      }
    })();
    return () => { cancelled = true; };
  }, [initialPhone]);

  // Form state
  const [form, setForm] = React.useState<CheckoutFormState>({
    name: "",
    phone: "",
    addressLine: "",
    email: "",
    alternatePhone: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  // Validation state
  const [validation, setValidation] = React.useState<FormValidation>({
    isValid: false,
    errors: {},
  });
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  // Coupon state
  const [couponCode, setCouponCode] = React.useState("");
  const [couponMessage, setCouponMessage] = React.useState<string | null>(null);
  const [discount, setDiscount] = React.useState(0);
  const [payable, setPayable] = React.useState(cart.totalPrice);

  // Status messages
  const [message, setMessage] = React.useState<string | null>(null);

  // Update payable when cart total or discount changes
  React.useEffect(() => {
    setPayable(Math.max(0, cart.totalPrice - discount));
  }, [cart.totalPrice, discount]);

  // Run validation whenever form changes
  React.useEffect(() => {
    const result = validateCheckoutForm(form);
    setValidation(result);
  }, [form]);

  // Form field change handler
  function updateField(field: keyof CheckoutFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Mark field as touched on blur
  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  // Get error for a field (only show if touched)
  function getFieldError(field: string): string | undefined {
    if (!touched[field]) return undefined;
    return validation.errors[field];
  }

  // Coupon application
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

  // WhatsApp order submission
  function handleOrderOnWhatsApp() {
    if (!storePhone) {
      alert("WhatsApp ordering is currently unavailable. Store phone not configured. Please contact the store.");
      return;
    }

    const orderData = {
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        addressLine: form.addressLine.trim(),
        ...(form.email.trim() && { email: form.email.trim() }),
        ...(form.alternatePhone.trim() && { alternatePhone: form.alternatePhone.trim() }),
        ...(form.city.trim() && { city: form.city.trim() }),
        ...(form.state.trim() && { state: form.state.trim() }),
        ...(form.pincode.trim() && { pincode: form.pincode.trim() }),
        ...(form.landmark.trim() && { landmark: form.landmark.trim() }),
      },
      items: cart.items,
      subtotal: cart.totalPrice,
      discount,
      total: payable,
    };

    const messageText = buildWhatsAppOrderMessage(orderData);
    const url = buildWhatsAppUrl(storePhone, messageText);

    if (!url) {
      setMessage("Could not generate WhatsApp link. Please try again.");
      return;
    }

    window.open(url, "_blank", "noreferrer");
    cart.clearCart();
    setMessage("Order sent to WhatsApp! The store will confirm your order shortly.");
  }

  const isCartEmpty = cart.items.length === 0;
  // Button enabled when: required fields are valid AND cart has items
  // Optional field errors (email, alternatePhone, pincode) show warnings but don't block
  const requiredFieldsValid =
    form.name.trim().length > 0 &&
    form.name.trim().length <= 100 &&
    /^\d{10}$/.test(form.phone.trim()) &&
    form.addressLine.trim().length > 0 &&
    form.addressLine.trim().length <= 250;
  const isButtonDisabled = !requiredFieldsValid || isCartEmpty;

  return (
    <main className="container-pad section-pad max-w-2xl bg-background">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill in your delivery details and place your order via WhatsApp.
        {!isCartEmpty && (
          <>
            {" "}Your cart total is{" "}
            <span className="font-semibold text-primary">
              {formatINR(cart.totalPrice)}
            </span>.
          </>
        )}
      </p>

      {/* Empty cart message */}
      {isCartEmpty && (
        <div className="mt-4 rounded-sm border border-border bg-white p-5 text-sm">
          <div className="font-semibold text-foreground">Your cart is empty</div>
          <div className="mt-1 text-muted-foreground">
            Add at least one product to continue.
          </div>
          <div className="mt-4">
            <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
              <Link href="/">Continue shopping</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Store phone not configured warning */}
      {!storePhone && (
        <div className="mt-4 rounded-sm border border-border bg-white p-5 text-sm">
          <div className="font-semibold text-foreground">WhatsApp ordering is currently unavailable</div>
          <div className="mt-1 text-muted-foreground">
            The store WhatsApp number has not been configured. Please contact the store directly.
          </div>
        </div>
      )}

      <Separator className="my-6" />

      <div className="space-y-6 mt-6">
        {/* Delivery details form */}
        <div className="rounded-sm border border-border bg-white p-5">
          <div className="text-sm font-semibold text-foreground">Delivery details</div>
          <div className="mt-4 grid gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                Full name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="Your name"
                className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              {getFieldError("name") && (
                <p className="text-xs text-red-600">{getFieldError("name")}</p>
              )}
            </div>

            {/* Phone + Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="10-digit mobile number"
                  className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                {getFieldError("phone") && (
                  <p className="text-xs text-red-600">{getFieldError("phone")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Email (optional)
                </Label>
                <Input
                  id="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="you@example.com"
                  className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                {getFieldError("email") && (
                  <p className="text-xs text-red-600">{getFieldError("email")}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-semibold text-foreground">
                Address line <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                value={form.addressLine}
                onChange={(e) => updateField("addressLine", e.target.value)}
                onBlur={() => handleBlur("addressLine")}
                placeholder="House, street, area"
                className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              {getFieldError("addressLine") && (
                <p className="text-xs text-red-600">{getFieldError("addressLine")}</p>
              )}
            </div>

            {/* City + State */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-semibold text-foreground">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-xs font-semibold text-foreground">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            </div>

            {/* Pincode + Alternate phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-xs font-semibold text-foreground">Pincode</Label>
                <Input
                  id="pincode"
                  value={form.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                  onBlur={() => handleBlur("pincode")}
                  className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                {getFieldError("pincode") && (
                  <p className="text-xs text-red-600">{getFieldError("pincode")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternatePhone" className="text-xs font-semibold text-foreground">
                  Alternate phone
                </Label>
                <Input
                  id="alternatePhone"
                  value={form.alternatePhone}
                  onChange={(e) => updateField("alternatePhone", e.target.value)}
                  onBlur={() => handleBlur("alternatePhone")}
                  className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                {getFieldError("alternatePhone") && (
                  <p className="text-xs text-red-600">{getFieldError("alternatePhone")}</p>
                )}
              </div>
            </div>

            {/* Landmark */}
            <div className="space-y-2">
              <Label htmlFor="landmark" className="text-xs font-semibold text-foreground">Landmark</Label>
              <Input
                id="landmark"
                value={form.landmark}
                onChange={(e) => updateField("landmark", e.target.value)}
                className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Cart summary */}
        {!isCartEmpty && (
          <div className="rounded-sm border border-border bg-white p-5">
            <div className="text-sm font-semibold text-foreground">Order summary</div>
            <div className="mt-4 space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground font-medium truncate block">{item.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.qty} × {formatINR(item.sell_price)}
                    </span>
                  </div>
                  <span className="text-foreground font-medium ml-4">
                    {formatINR(item.sell_price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium">{formatINR(cart.totalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-medium">-{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-foreground border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">{formatINR(payable)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Promo code */}
        <div className="rounded-sm border border-border bg-white p-5">
          <div className="text-sm font-semibold text-foreground">Promo code</div>
          <div className="mt-4 flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="SAVE10"
              className="rounded-md border-border focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <Button
              type="button"
              className="rounded-full bg-primary hover:bg-primary/90 text-white"
              onClick={applyCoupon}
              disabled={!couponCode.trim() || isCartEmpty}
            >
              Apply
            </Button>
          </div>
          {couponMessage && <div className="mt-2 text-xs text-muted-foreground">{couponMessage}</div>}
        </div>

        {/* Success message */}
        {message && (
          <div className="rounded-sm border border-border bg-white p-4 text-sm text-foreground">
            {message}
          </div>
        )}

        {/* Order on WhatsApp button */}
        <Button
          type="button"
          className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-base"
          disabled={isButtonDisabled}
          onClick={handleOrderOnWhatsApp}
        >
          Order on WhatsApp
        </Button>
      </div>
    </main>
  );
}
