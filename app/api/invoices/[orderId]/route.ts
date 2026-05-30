// ============================================
// FILE: app/api/invoices/[orderId]/route.ts
// PURPOSE: Generate (or fetch cached) PDF invoice for an order.
//   * Customer can fetch invoices for their own orders.
//   * Admin can fetch any order's invoice.
// SECURITY: Uses the user's Supabase session and RLS to enforce
//   ownership; if RLS denies the read, we return 404.
// ============================================

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import * as React from "react";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import InvoiceDocument from "@/components/admin/InvoiceDocument";
import { createClient } from "@/lib/supabase/server";
import type { Invoice, Order, OrderItem, SiteSettings } from "@/types";

// Force Node.js runtime — @react-pdf/renderer is not edge-compatible.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { orderId: string };

export async function GET(
  _request: Request,
  context: { params: Promise<Params> },
) {
  const { orderId } = await context.params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Authenticate
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pull order, items, settings (RLS will only return rows the user can see).
    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !orderRow) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const order = orderRow as unknown as Order;

    const { data: itemRows } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);
    const items = ((itemRows as unknown) as OrderItem[]) ?? [];

    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    const settings = (settingsRow as unknown as SiteSettings) ?? null;
    if (!settings) {
      return NextResponse.json({ error: "Site not configured" }, { status: 500 });
    }

    // Find or create invoice row.
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    let invoice = (existingInvoice as unknown as Invoice) ?? null;
    if (!invoice) {
      // Tax math.
      // -----------------------------------------------------------------
      // INCLUSIVE (default, settings.prices_tax_inclusive !== false):
      //   The sell price the customer paid ALREADY contains GST. We
      //   reverse-extract the base and tax from (gross - discount), so the
      //   printed total exactly matches what was charged at checkout.
      // EXCLUSIVE (settings.prices_tax_inclusive === false):
      //   The sell price is pre-tax. GST is added on top of the post-discount
      //   base.
      const inclusive = settings.prices_tax_inclusive !== false;
      const taxRate =
        Number(order.tax_rate ?? settings.tax_rate_default ?? 0) || 0;
      const gross = Number(order.subtotal_amount ?? order.total_amount ?? 0);
      const discount = Number(order.discount_amount ?? 0);

      let subtotalBase: number;
      let taxAmount: number;
      let total: number;

      if (inclusive && taxRate > 0) {
        const taxableInclusive = Math.max(0, gross - discount);
        subtotalBase = Number(
          (taxableInclusive / (1 + taxRate / 100)).toFixed(2),
        );
        taxAmount = Number((taxableInclusive - subtotalBase).toFixed(2));
        total = Number((subtotalBase + taxAmount).toFixed(2));
      } else {
        subtotalBase = Math.max(0, gross - discount);
        taxAmount =
          taxRate > 0
            ? Number((subtotalBase * (taxRate / 100)).toFixed(2))
            : 0;
        total = Number((subtotalBase + taxAmount).toFixed(2));
      }

      const { data: created, error: createErr } = await supabase
        .from("invoices")
        .insert({
          order_id: orderId,
          subtotal: subtotalBase,
          discount_amount: discount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total: total > 0 ? total : Number(order.total_amount ?? 0),
          currency: order.currency ?? "INR",
          gstin: order.gstin ?? null,
          billing_name: order.billing_name ?? order.customer_name ?? null,
          billing_address:
            order.billing_address ?? order.shipping_address ?? null,
          billing_phone: order.customer_phone ?? null,
          billing_email: order.customer_email ?? null,
        })
        .select("*")
        .single();
      if (createErr || !created) {
        return NextResponse.json(
          { error: "Failed to create invoice" },
          { status: 500 },
        );
      }
      invoice = created as unknown as Invoice;
    }

    // Render PDF.
    const element = React.createElement(InvoiceDocument, {
      invoice,
      order,
      items,
      settings,
    }) as unknown as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);

    // Best-effort: cache to private storage so future fetches can be served
    // via a signed URL. Failure here should not block the customer download.
    if (!invoice.pdf_url) {
      try {
        const path = `${invoice.invoice_number}.pdf`;
        const { error: upErr } = await supabase.storage
          .from("invoices")
          .upload(path, buffer, {
            upsert: true,
            contentType: "application/pdf",
          });
        if (!upErr) {
          const { data: signed } = await supabase.storage
            .from("invoices")
            .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
          if (signed?.signedUrl) {
            await supabase
              .from("invoices")
              .update({ pdf_url: signed.signedUrl })
              .eq("id", invoice.id);
          }
        }
      } catch (cacheErr) {
        console.warn("[invoices] cache upload failed:", cacheErr);
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[invoices] error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 },
    );
  }
}
