// ============================================
// FILE: app/account/wishlist/page.tsx
// PURPOSE: Customer's saved-for-later products (wishlist).
// USED IN: /account/wishlist
// ============================================

import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import { createClient } from "@/lib/supabase/server";
import {
  getBrandSettings,
  getCategories,
  getSiteSettings,
  getSubcategories,
} from "@/utils/store/queries";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
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
  if (error || !user) redirect("/auth/login?next=/account/wishlist");

  const { data: rows } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const productIds =
    ((rows as unknown) as { product_id: string }[] | null)?.map(
      (r) => r.product_id,
    ) ?? [];

  let products: Product[] = [];
  if (productIds.length) {
    const { data: prodRows } = await supabase
      .from("products")
      .select("*, brand:brands(*)")
      .in("id", productIds);
    products = ((prodRows as unknown) as Product[]) ?? [];
  }

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
              My Wishlist
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {products.length} saved item{products.length === 1 ? "" : "s"}
            </div>
          </div>
          <Link
            href="/account"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to account
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Your wishlist is empty.{" "}
            <Link href="/" className="font-medium text-foreground underline">
              Browse products
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer settings={safeSettings} brand={brand} />
    </>
  );
}
