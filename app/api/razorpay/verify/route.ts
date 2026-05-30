// ============================================
// FILE: app/api/razorpay/verify/route.ts
// PURPOSE: Verify Razorpay signature and mark order as paid
// USED IN: app/checkout/page.tsx
// INTERN NOTE: Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
// ============================================

import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

type VerifyBody = {
  orderId: string; // our Supabase order id
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseAdmin(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * POST
 * Verifies payment signature and updates order row.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Missing Razorpay secret" }, { status: 500 });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex");

    const ok = expected === body.razorpay_signature;
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 },
      );
    }

    const { error } = await admin
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        razorpay_order_id: body.razorpay_order_id,
        razorpay_payment_id: body.razorpay_payment_id,
        razorpay_signature: body.razorpay_signature,
      })
      .eq("id", body.orderId);

    if (error) {
      console.error("[verify] supabase update error:", error);
      return NextResponse.json({ ok: false, error: "Failed to update order" }, { status: 500 });
    }

    await admin
      .from("payment_attempts")
      .update({
        status: "paid",
        provider_payment_id: body.razorpay_payment_id,
        provider_signature: body.razorpay_signature,
      })
      .eq("order_id", body.orderId)
      .eq("provider", "razorpay");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[verify] error:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

