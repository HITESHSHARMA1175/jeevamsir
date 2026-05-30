import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { LogoutButton } from "@/components/logout-button";
import AccountProfileForm from "@/components/store/AccountProfileForm";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/utils/store/formatPrice";
import { getBrandSettings, getCategories, getSiteSettings, getSubcategories } from "@/utils/store/queries";

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
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [settings, categories, subcategories, brand] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getSubcategories(),
    getBrandSettings(),
  ]);

  const safeSettings = settings ?? {
    id: "missing",
    site_name: "ShopKart",
    logo_url: null,
    meta_title: "ShopKart",
    meta_desc: "Shop authentic Rudraksha, gemstones, malas, and spiritual essentials.",
    meta_desc: "ShopKart brings you unbeatable prices across electronics, fashion, and more.",
    og_image: null,
    ga_id: null,
    whatsapp: "7705074250",
    created_at: null,
    updated_at: null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (error || !user) redirect("/auth/login");

  const email = user.email ?? "";
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const initialFullName =
    typeof userMeta?.full_name === "string" ? userMeta.full_name : "";
  const initialPhone = typeof userMeta?.phone === "string" ? userMeta.phone : "";
  const initialAddress =
    typeof userMeta?.address === "string" ? userMeta.address : "";

  const { data: ordersData } = await supabase
    .from("orders")
    .select("id, created_at, customer_email, total_amount, subtotal_amount, discount_amount, coupon_code, status, payment_method, payment_status, shipping_address")
    .or(`customer_email.eq.${email},user_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = ((ordersData as unknown) as OrderRow[]) ?? [];
  const orderIds = orders.map((o) => o.id);

  const { data: itemsData } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("id, order_id, product_name, qty, sell_price, line_total")
        .in("order_id", orderIds)
    : { data: [] as unknown[] };

  const items = ((itemsData as unknown) as OrderItemRow[]) ?? [];
  const itemsByOrder = new Map<string, OrderItemRow[]>();
  items.forEach((it) => {
    const list = itemsByOrder.get(it.order_id) ?? [];
    list.push(it);
    itemsByOrder.set(it.order_id, list);
  });

  return (
    <>
      <Header settings={safeSettings} categories={categories} subcategories={subcategories} />
      <main className="container-pad section-pad space-y-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[var(--text-heading)] font-semibold tracking-tight">
              My Account
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">{email}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="text-sm text-muted-foreground hover:text-foreground"
              href="/"
            >
              Continue shopping
            </Link>
            <LogoutButton />
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5">
            <div className="text-base font-semibold">Profile</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Update your details for faster checkout and order tracking.
            </div>
            <div className="mt-5">
              <AccountProfileForm
                initialFullName={initialFullName}
                initialPhone={initialPhone}
                initialAddress={initialAddress}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="text-base font-semibold">Orders</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Your orders placed using this email.
            </div>

            <div className="mt-5 space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border bg-background p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">
                        Order #{o.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Status:{" "}
                        <span className="font-medium text-foreground">
                          {o.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
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
                      <div className="font-semibold">{formatINR(Number(o.total_amount))}</div>
                      {Number(o.discount_amount ?? 0) > 0 && (
                        <div className="text-xs text-emerald-700">
                          Saved {formatINR(Number(o.discount_amount))} {o.coupon_code ? `with ${o.coupon_code}` : ""}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-1 border-t pt-3 text-xs text-muted-foreground">
                    <div>Subtotal: {formatINR(Number(o.subtotal_amount ?? o.total_amount))}</div>
                    <div>Discount: {formatINR(Number(o.discount_amount ?? 0))}</div>
                    {o.shipping_address && <div className="whitespace-pre-line">Deliver to: {o.shipping_address}</div>}
                  </div>

                  {itemsByOrder.get(o.id)?.length ? (
                    <div className="mt-3 space-y-2">
                      {itemsByOrder.get(o.id)!.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0 flex-1 truncate">
                            {it.product_name}{" "}
                            <span className="text-muted-foreground">
                              ×{it.qty}
                            </span>
                          </div>
                          <div className="flex-shrink-0 font-medium">
                            {formatINR(Number(it.line_total))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {orders.length === 0 && (
                <div className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
                  No orders found for this email yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer settings={safeSettings} brand={brand} />
    </>
  );
}

