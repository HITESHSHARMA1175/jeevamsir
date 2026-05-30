// ============================================
// FILE: app/account/reviews/page.tsx
// PURPOSE: Customer's own reviews (with status pill).
// USED IN: /account/reviews
// ============================================

import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  getBrandSettings,
  getCategories,
  getSiteSettings,
  getSubcategories,
} from "@/utils/store/queries";

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string | null;
  product_id: string;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export const dynamic = "force-dynamic";

function statusPill(status: ReviewRow["status"]) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function AccountReviewsPage() {
  const [settings, categories, subcategories, brand] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getSubcategories(),
    getBrandSettings(),
  ]);

  const safeSettings = settings ?? {
    id: "missing",
    site_name: "Techpotli Store",
    logo_url: null,
    meta_title: "Techpotli Store",
    meta_desc: "Shop online.",
    og_image: null,
    ga_id: null,
    whatsapp: "7705074250",
    created_at: null,
    updated_at: null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (error || !user) redirect("/auth/login?next=/account/reviews");

  const { data: rows } = await supabase
    .from("product_reviews")
    .select("id, rating, title, body, status, created_at, product_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const reviews = ((rows as unknown) as ReviewRow[]) ?? [];

  const productIds = Array.from(new Set(reviews.map((r) => r.product_id)));
  const { data: prodRows } = productIds.length
    ? await supabase
        .from("products")
        .select("id, name, slug, image_url")
        .in("id", productIds)
    : { data: [] as unknown[] };
  const productById = new Map<string, ProductRow>();
  ((prodRows as unknown) as ProductRow[] | null)?.forEach((p) =>
    productById.set(p.id, p),
  );

  return (
    <>
      <Header
        settings={safeSettings}
        categories={categories}
        subcategories={subcategories}
      />
      <main className="container-pad section-pad space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[var(--text-heading)] font-semibold tracking-tight">
              My Reviews
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              Pending reviews are awaiting admin approval before going public.
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
          {reviews.length === 0 && (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
              You haven&apos;t written any reviews yet.
            </div>
          )}
          {reviews.map((r) => {
            const product = productById.get(r.product_id);
            return (
              <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {product ? (
                        <Link
                          href={`/products/${product.slug}`}
                          className="hover:underline"
                        >
                          {product.name}
                        </Link>
                      ) : (
                        "Product"
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {"★".repeat(r.rating)}
                      <span className="text-slate-300">
                        {"★".repeat(Math.max(0, 5 - r.rating))}
                      </span>{" "}
                      · {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusPill(r.status)}`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.title && (
                  <div className="mt-3 text-sm font-semibold">{r.title}</div>
                )}
                {r.body && (
                  <div className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {r.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer settings={safeSettings} brand={brand} />
    </>
  );
}
