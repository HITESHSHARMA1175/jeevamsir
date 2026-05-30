import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Coupon, Product } from "@/types";
import {
  calculateCouponDiscount,
  calculateSubtotal,
  normalizeCouponCode,
  type CheckoutInputItem,
  type PricedCheckoutItem,
} from "@/utils/store/checkout";

type ApplyCouponBody = {
  code?: string;
  items?: CheckoutInputItem[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplyCouponBody;
    const code = normalizeCouponCode(body.code ?? "");
    const items = Array.isArray(body.items) ? body.items : [];

    if (!code) return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    if (items.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    const supabase = await createClient();
    const productIds = items.map((item) => item.id);
    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("*, brand:brands(*)")
      .in("id", productIds)
      .eq("in_stock", true);
    if (productError || !productRows) {
      return NextResponse.json({ error: "Could not validate cart" }, { status: 400 });
    }

    const products = productRows as unknown as Product[];
    const productById = new Map(products.map((product) => [product.id, product]));
    const pricedItems: PricedCheckoutItem[] = items.flatMap((item) => {
      const product = productById.get(item.id);
      const qty = Math.max(1, Number(item.qty) || 1);
      if (!product) return [];
      return [{ product, qty, lineTotal: Number(product.sell_price) * qty }];
    });

    const subtotal = calculateSubtotal(pricedItems);
    const { data: couponRow } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (!couponRow) {
      return NextResponse.json({ ok: false, error: "Invalid coupon", subtotal, discount: 0, total: subtotal });
    }

    const coupon = couponRow as unknown as Coupon;
    const result = calculateCouponDiscount({ coupon, items: pricedItems });
    const total = Math.max(0, subtotal - result.discount);

    return NextResponse.json({
      ok: result.ok,
      message: result.reason,
      couponId: result.ok ? coupon.id : null,
      couponCode: result.ok ? coupon.code : null,
      subtotal,
      discount: result.discount,
      total,
    });
  } catch (error) {
    console.error("[apply_coupon] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

