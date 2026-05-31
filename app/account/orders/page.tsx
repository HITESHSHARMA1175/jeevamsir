// ============================================
// FILE: app/account/orders/page.tsx
// PURPOSE: Customer-facing order history with download-invoice
//          links for paid/delivered orders.
// USED IN: /account/orders
// ============================================

import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/utils/store/formatPrice";
import {
  getBrandSettings,
  getCategories,
  getSiteSettings,
  getSubcategories,
} from "@/utils/store/queries";

type OrderRow = {
  id: string;
  created_at: string | null;
  customer_email: string | null;
  total_amount: number;
  subtotal_amount?: number;
  discount_amount?: number;
  coupon_code?: string | null;
  status: string;
  payment_method?: string | null;
  payment_status?: string | null;
  shipping_address?: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_name: string;
  qty: number;
  sell_price: number;
  line_total: number;
  selected_options?: Record<string, string>;
};

type InvoiceRow = {
  id: string;
  order_id: string;
  invoice_number: string;
  pdf_url: string | null;
};

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const [settings, categories, subcategories, brand] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getSubcategories(),
    getBrandSettings(),
  ]);

  const safeSettings = settings ?? {
    id: "missing",
    site_name: "Ayurveda Store",
    logo_url: null,
    meta_title: "Ayurveda Store",
    meta_desc: "Discover authentic Ayurveda essentials.",
    og_image: null,
    ga_id: null,
    whatsapp: "7705074250",
    created_at: null,
    updated_at: null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (error || !user) redirect("/auth/login?next=/account/orders");

  const email = user.email ?? "";

  const { data: ordersData } = await supabase
    .from("orders")
    .select(
      "id, created_at, customer_email, total_amount, subtotal_amount, discount_amount, coupon_code, status, payment_method, payment_status, shipping_address",
    )
    .or(`customer_email.eq.${email},user_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = ((ordersData as unknown) as OrderRow[]) ?? [];
  const orderIds = orders.map((o) => o.id);

  const { data: itemsData } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("id, order_id, product_name, qty, sell_price, line_total, selected_options")
        .in("order_id", orderIds)
    : { data: [] as unknown[] };
  const items = ((itemsData as unknown) as OrderItemRow[]) ?? [];
  const itemsByOrder = new Map<string, OrderItemRow[]>();
  items.forEach((it) => {
    const list = itemsByOrder.get(it.order_id) ?? [];
    list.push(it);
    itemsByOrder.set(it.order_id, list);
  });

  const { data: invoicesData } = orderIds.length
    ? await supabase
        .from("invoices")
        .select("id, order_id, invoice_number, pdf_url")
        .in("order_id", orderIds)
    : { data: [] as unknown[] };
  const invoiceByOrder = new Map<string, InvoiceRow>();
  ((invoicesData as unknown) as InvoiceRow[] | null)?.forEach((inv) => {
    invoiceByOrder.set(inv.order_id, inv);
  });

  return (
    <>
      <Header settings={safeSettings} categories={categories} subcategories={subcategories} />
      <main className="container-pad section-pad space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[var(--text-heading)] font-semibold tracking-tight">
              My Orders
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              Track delivery, view items, and download invoices.
            </div>
          </div>
          <Link
            href="/account"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to account
          </Link>
        </div>

        <div className="space-y-4">
          {orders.length === 0 && (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
              You don&apos;t have any orders yet.{" "}
              <Link href="/" className="font-medium text-foreground underline">
                Start shopping
              </Link>
              .
            </div>
          )}

          {orders.map((o) => {
            const invoice = invoiceByOrder.get(o.id);
            const canDownload =
              o.payment_status === "paid" ||
              ["packed", "shipped", "delivered"].includes(o.status);
            return (
              <div key={o.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">
                      Order #{o.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status: <span className="font-medium text-foreground">{o.status}</span>
                      {" · "}
                      Payment:{" "}
                      <span className="font-medium text-foreground">
                        {o.payment_method ?? "razorpay"} · {o.payment_status ?? "pending"}
                      </span>
                    </div>
                    {o.created_at && (
                      <div className="text-xs text-muted-foreground">
                        Placed: {new Date(o.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">
                      {formatINR(Number(o.total_amount))}
                    </div>
                    {Number(o.discount_amount ?? 0) > 0 && (
                      <div className="text-xs text-emerald-700">
                        Saved {formatINR(Number(o.discount_amount))}{" "}
                        {o.coupon_code ? `with ${o.coupon_code}` : ""}
                      </div>
                    )}
                    {canDownload && (
                      <a
                        href={`/api/invoices/${o.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-medium text-blue-700 underline-offset-4 hover:underline"
                      >
                        Download invoice
                        {invoice?.invoice_number ? ` · ${invoice.invoice_number}` : ""}
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid gap-1 border-t pt-3 text-xs text-muted-foreground">
                  {o.shipping_address && (
                    <div className="whitespace-pre-line">Deliver to: {o.shipping_address}</div>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {(itemsByOrder.get(o.id) ?? []).map((it) => (
                    <div
                      key={it.id}
                      className="flex flex-col gap-1 border-t pt-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{it.product_name}</div>
                        {it.selected_options &&
                          Object.keys(it.selected_options).length > 0 && (
                            <div className="text-[11px] text-muted-foreground">
                              {Object.entries(it.selected_options)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" • ")}
                            </div>
                          )}
                        <div className="text-xs text-muted-foreground">x{it.qty}</div>
                      </div>
                      <div className="font-medium">{formatINR(Number(it.line_total))}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer settings={safeSettings} brand={brand} />
    </>
  );
}
