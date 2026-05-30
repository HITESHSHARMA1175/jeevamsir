// ============================================
// FILE: app/api/razorpay/webhook/route.ts
// PURPOSE: Razorpay webhook → update order status in Supabase
// USED IN: Razorpay Dashboard Webhooks
// INTERN NOTE: Requires RAZORPAY_WEBHOOK_SECRET + SUPABASE_SERVICE_ROLE_KEY
// ============================================

import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseAdmin(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * POST
 * Handles Razorpay webhook events.
 */
export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ ok: false, error: "Missing webhook secret" }, { status: 500 });
    }

    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const rawBody = await request.text();

    if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as unknown;
    const p = payload as Record<string, unknown>;
    const event = typeof p.event === "string" ? p.event : undefined;

    const payloadObj = (p.payload ?? {}) as Record<string, unknown>;
    const paymentObj = (payloadObj.payment ?? {}) as Record<string, unknown>;
    const paymentEntity = (paymentObj.entity ?? {}) as Record<string, unknown>;
    const orderObj = (payloadObj.order ?? {}) as Record<string, unknown>;
    const orderEntity = (orderObj.entity ?? {}) as Record<string, unknown>;

    const rpOrderId =
      (typeof paymentEntity.order_id === "string" ? paymentEntity.order_id : null) ??
      (typeof orderEntity.id === "string" ? orderEntity.id : null);

    if (!rpOrderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 },
      );
    }

    const nextStatus =
      event === "payment.captured"
        ? "paid"
        : event === "payment.failed"
          ? "failed"
          : null;

    if (!nextStatus) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { error } = await admin
      .from("orders")
      .update({ status: nextStatus })
      .eq("razorpay_order_id", rpOrderId);

    if (error) {
      console.error("[webhook] update error:", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook] error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

