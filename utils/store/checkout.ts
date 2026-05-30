import type { Coupon, Product } from "@/types";

export type CheckoutInputItem = {
  id: string;
  qty: number;
  selected_options?: Record<string, string>;
};

export type PricedCheckoutItem = {
  product: Product;
  qty: number;
  lineTotal: number;
  selected_options?: Record<string, string>;
};

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function calculateSubtotal(items: PricedCheckoutItem[]) {
  return items.reduce((sum, item) => sum + item.lineTotal, 0);
}

export function couponMatchesProduct(coupon: Coupon, product: Product) {
  if (coupon.applies_to === "all") return true;
  if (coupon.applies_to === "product") return coupon.product_id === product.id;
  if (coupon.applies_to === "category") return coupon.category_id === product.category_id;
  if (coupon.applies_to === "brand") return coupon.brand_id === product.brand_id;
  return false;
}

export function calculateCouponDiscount({
  coupon,
  items,
}: {
  coupon: Coupon;
  items: PricedCheckoutItem[];
}) {
  const now = Date.now();
  if (!coupon.is_active) return { ok: false, reason: "Coupon is inactive", discount: 0 };
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { ok: false, reason: "Coupon is not active yet", discount: 0 };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return { ok: false, reason: "Coupon has expired", discount: 0 };
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { ok: false, reason: "Coupon usage limit reached", discount: 0 };
  }

  const subtotal = calculateSubtotal(items);
  if (subtotal < coupon.min_order_amount) {
    return {
      ok: false,
      reason: `Minimum order amount is ${coupon.min_order_amount}`,
      discount: 0,
    };
  }

  const eligibleSubtotal = items
    .filter((item) => couponMatchesProduct(coupon, item.product))
    .reduce((sum, item) => sum + item.lineTotal, 0);

  if (eligibleSubtotal <= 0) {
    return { ok: false, reason: "Coupon is not applicable to these products", discount: 0 };
  }

  const rawDiscount =
    coupon.discount_type === "percent"
      ? eligibleSubtotal * (coupon.discount_value / 100)
      : coupon.discount_value;
  const capped =
    coupon.max_discount_amount !== null
      ? Math.min(rawDiscount, coupon.max_discount_amount)
      : rawDiscount;
  const discount = Math.max(0, Math.min(subtotal, Number(capped.toFixed(2))));

  return { ok: true, reason: "Coupon applied", discount };
}

