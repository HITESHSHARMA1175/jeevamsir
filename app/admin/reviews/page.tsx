// ============================================
// FILE: app/admin/reviews/page.tsx
// PURPOSE: Admin moderation for product reviews.
// USED IN: /admin/reviews
// ============================================

import AdminShell from "@/components/admin/AdminShell";
import ReviewsAdmin from "@/components/admin/ReviewsAdmin";
import { createClient } from "@/lib/supabase/server";
import type { ProductReview } from "@/types";

export const dynamic = "force-dynamic";

type ProductLite = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export default async function AdminReviews() {
  const supabase = await createClient();

  const { data: reviewRows } = await supabase
    .from("product_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const reviews = ((reviewRows as unknown) as ProductReview[]) ?? [];

  const productIds = Array.from(new Set(reviews.map((r) => r.product_id)));
  let products: ProductLite[] = [];
  if (productIds.length) {
    const { data: prodRows } = await supabase
      .from("products")
      .select("id, name, slug, image_url")
      .in("id", productIds);
    products = ((prodRows as unknown) as ProductLite[]) ?? [];
  }

  return (
    <AdminShell title="Reviews">
      <ReviewsAdmin initial={reviews} products={products} />
    </AdminShell>
  );
}
