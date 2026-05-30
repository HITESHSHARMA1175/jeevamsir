import Razorpay from "razorpay";
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

type PaymentMethod = "cod" | "razorpay" | "phonepe";

type CreateOrderBody = {
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    alternatePhone?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  items?: CheckoutInputItem[];
  couponCode?: string;
  paymentMethod?: PaymentMethod;
  currency?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const items = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = body.paymentMethod ?? "razorpay";
    const currency = body.currency ?? "INR";

    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (paymentMethod === "phonepe") {
      return NextResponse.json(
        { error: "PhonePe integration is coming soon", code: "PHONEPE_NOT_CONFIGURED" },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;

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
      return [
        {
          product,
          qty,
          lineTotal: Number(product.sell_price) * qty,
          selected_options:
            item.selected_options && typeof item.selected_options === "object"
              ? item.selected_options
              : undefined,
        },
      ];
    });

    if (pricedItems.length === 0) {
      return NextResponse.json({ error: "No valid products in cart" }, { status: 400 });
    }

    const subtotal = calculateSubtotal(pricedItems);
    let coupon: Coupon | null = null;
    let discount = 0;
    const couponCode = normalizeCouponCode(body.couponCode ?? "");
    if (couponCode) {
      const { data: couponRow } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .maybeSingle();
      if (couponRow) {
        coupon = couponRow as unknown as Coupon;
        const result = calculateCouponDiscount({ coupon, items: pricedItems });
        if (result.ok) discount = result.discount;
      }
    }

    const total = Math.max(0, Number((subtotal - discount).toFixed(2)));
    const shippingAddress = [
      body.customer?.addressLine,
      body.customer?.landmark,
      body.customer?.city,
      body.customer?.state,
      body.customer?.pincode,
    ]
      .filter(Boolean)
      .join("\n");

    let razorpayOrderId: string | null = null;
    let keyId: string | null = null;
    let amountPaise = Math.round(total * 100);

    if (paymentMethod === "razorpay") {
      keyId = process.env.RAZORPAY_KEY_ID ?? null;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        return NextResponse.json(
          { error: "Razorpay is not configured yet.", code: "RAZORPAY_NOT_CONFIGURED" },
          { status: 503 },
        );
      }
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const rpOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency,
        receipt: `tp_${Date.now()}`,
      });
      razorpayOrderId = rpOrder.id;
      amountPaise = Number(rpOrder.amount);
    }

    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        customer_name: body.customer?.name ?? null,
        customer_phone: body.customer?.phone ?? null,
        customer_email: body.customer?.email ?? user?.email ?? null,
        alternate_phone: body.customer?.alternatePhone ?? null,
        shipping_address: shippingAddress || null,
        address_line: body.customer?.addressLine ?? null,
        city: body.customer?.city ?? null,
        state: body.customer?.state ?? null,
        pincode: body.customer?.pincode ?? null,
        landmark: body.customer?.landmark ?? null,
        currency,
        subtotal_amount: subtotal,
        discount_amount: discount,
        coupon_id: coupon?.id ?? null,
        coupon_code: coupon?.code ?? null,
        total_amount: total,
        status: "created",
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cod" ? "unpaid" : "pending",
        razorpay_order_id: razorpayOrderId,
        whatsapp_phone: body.customer?.phone ?? null,
      })
      .select("*")
      .single();

    if (orderError || !orderRow) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    await supabase.from("order_items").insert(
      pricedItems.map((item) => ({
        order_id: orderRow.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_slug: item.product.slug,
        image_url: item.product.image_url,
        mrp_price: item.product.mrp_price,
        sell_price: item.product.sell_price,
        qty: item.qty,
        line_total: item.lineTotal,
        selected_options: item.selected_options ?? {},
      })),
    );

    await supabase.from("payment_attempts").insert({
      order_id: orderRow.id,
      provider: paymentMethod,
      status: paymentMethod === "cod" ? "pending" : "pending",
      amount: total,
      currency,
      provider_order_id: razorpayOrderId,
      raw_metadata: {},
    });

    if (coupon) {
      await supabase
        .from("coupons")
        .update({ used_count: coupon.used_count + 1 })
        .eq("id", coupon.id);
    }

    return NextResponse.json({
      keyId,
      razorpayOrderId,
      amount: amountPaise,
      currency,
      orderId: orderRow.id,
      paymentMethod,
      subtotal,
      discount,
      total,
      ok: true,
    });
  } catch (error) {
    console.error("[create_order] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

