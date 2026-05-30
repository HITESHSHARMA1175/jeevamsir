// ============================================
// FILE: app/admin/products/page.tsx
// PURPOSE: Admin - CRUD products
// USED IN: /admin/products
// INTERN NOTE: Product slugs must be lowercase with dashes.
// ============================================

import AdminShell from "@/components/admin/AdminShell";
import ProductsAdmin from "@/components/admin/ProductsAdmin";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Category, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const supabase = await createClient();
  const [{ data: categories }, { data: brands }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("brands").select("*").order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("products").select("*, brand:brands(*)").order("created_at", { ascending: false }).limit(200),
  ]);

  return (
    <AdminShell title="Products">
      <ProductsAdmin
        categories={(categories as unknown as Category[]) ?? []}
        brands={(brands as unknown as Brand[]) ?? []}
        initial={(products as unknown as Product[]) ?? []}
      />
    </AdminShell>
  );
}

