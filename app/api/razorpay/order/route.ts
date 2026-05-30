// ============================================
// FILE: app/api/razorpay/order/route.ts
// PURPOSE: Create Razorpay order + persist draft order in Supabase
// USED IN: app/checkout/page.tsx
// INTERN NOTE: Set env vars for Razorpay + Supabase in .env.local
// ============================================

import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/types";

type CreateOrderBody = {
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: CartItem[];
  currency?: string;
};

function calcTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + Number(i.sell_price) * Number(i.qty), 0);
}

/**
 * POST
 * Creates a Razorpay order and stores a draft order in Supabase.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          error:
            "Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your env vars.",
          code: "RAZORPAY_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }

    const total = calcTotal(items);
    const amountPaise = Math.round(total * 100);

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: body.currency ?? "INR",
      receipt: `tp_${Date.now()}`,
    });

    const supabase = await createClient();

    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: body.customer?.name ?? null,
        customer_phone: body.customer?.phone ?? null,
        customer_email: body.customer?.email ?? null,
        shipping_address: body.customer?.address ?? null,
        currency: body.currency ?? "INR",
        total_amount: total,
        status: "created",
        razorpay_order_id: rpOrder.id,
        whatsapp_phone: body.customer?.phone ?? null,
      })
      .select("*")
      .single();

    if (orderError || !orderRow) {
      return NextResponse.json(
        { error: "Failed to create order in database" },
        { status: 500 },
      );
    }

    const itemsToInsert = items.map((i) => ({
      order_id: orderRow.id,
      product_id: i.id,
      product_name: i.name,
      product_slug: i.slug,
      image_url: i.image_url,
      mrp_price: i.mrp_price,
      sell_price: i.sell_price,
      qty: i.qty,
      line_total: Number(i.sell_price) * Number(i.qty),
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);
    if (itemsError) {
      // Non-fatal: payment can still proceed; admin can see order row.
      console.error("[create_order] order_items insert error:", itemsError);
    }

    return NextResponse.json({
      keyId,
      razorpayOrderId: rpOrder.id,
      amount: amountPaise,
      currency: rpOrder.currency,
      orderId: orderRow.id,
    });
  } catch (error) {
    console.error("[create_order] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

