// ============================================
// FILE: app/admin/banners/page.tsx
// PURPOSE: Admin - CRUD banners (carousel slides)
// USED IN: /admin/banners
// INTERN NOTE: Use large landscape images for best results.
// ============================================

import AdminShell from "@/components/admin/AdminShell";
import BannersAdmin from "@/components/admin/BannersAdmin";
import { createClient } from "@/lib/supabase/server";
import type { Banner, Category, HomepageSection, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminBanners() {
  const supabase = await createClient();
  const [{ data: banners }, { data: products }, { data: categories }, { data: sections }] =
    await Promise.all([
      supabase.from("banners").select("*").order("sort_order", { ascending: true }),
      supabase.from("products").select("*").order("name", { ascending: true }).limit(300),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("homepage_sections")
        .select("*")
        .eq("section_type", "banner")
        .order("sort_order", { ascending: true }),
    ]);

  return (
    <AdminShell title="Banners">
      <BannersAdmin
        initial={(banners as unknown as Banner[]) ?? []}
        products={(products as unknown as Product[]) ?? []}
        categories={(categories as unknown as Category[]) ?? []}
        sections={(sections as unknown as HomepageSection[]) ?? []}
      />
    </AdminShell>
  );
}

