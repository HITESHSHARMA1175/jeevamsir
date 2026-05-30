import AdminShell from "@/components/admin/AdminShell";
import CouponsAdmin from "@/components/admin/CouponsAdmin";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Category, Coupon, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const supabase = await createClient();
  const [{ data: coupons }, { data: categories }, { data: products }, { data: brands }] =
    await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("products").select("*, brand:brands(*)").order("name", { ascending: true }).limit(300),
      supabase.from("brands").select("*").order("name", { ascending: true }),
    ]);

  return (
    <AdminShell title="Coupons">
      <CouponsAdmin
        initial={(coupons as unknown as Coupon[]) ?? []}
        categories={(categories as unknown as Category[]) ?? []}
        products={(products as unknown as Product[]) ?? []}
        brands={(brands as unknown as Brand[]) ?? []}
      />
    </AdminShell>
  );
}

