import AdminShell from "@/components/admin/AdminShell";
import HomepageSectionsAdmin from "@/components/admin/HomepageSectionsAdmin";
import { createClient } from "@/lib/supabase/server";
import type { Banner, Brand, Category, HomepageSection, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminHomepage() {
  const supabase = await createClient();
  const [
    { data: sections },
    { data: products },
    { data: categories },
    { data: brands },
    { data: bannersData },
  ] = await Promise.all([
    supabase
      .from("homepage_sections")
      .select("*, homepage_section_products(product_id, sort_order)")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("*, brand:brands(*)")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("brands").select("*").order("name", { ascending: true }),
    // Pull every banner attached to a section so the admin's banner editor
    // can render without an extra round-trip per section card.
    supabase
      .from("banners")
      .select("*")
      .not("section_id", "is", null)
      .order("sort_order", { ascending: true }),
  ]);

  const banners = ((bannersData as unknown) as Banner[]) ?? [];
  const bannersBySection: Record<string, Banner[]> = {};
  banners.forEach((banner) => {
    const key = banner.section_id;
    if (!key) return;
    const list = bannersBySection[key] ?? [];
    list.push(banner);
    bannersBySection[key] = list;
  });

  return (
    <AdminShell title="Homepage">
      <HomepageSectionsAdmin
        initial={(sections as unknown as HomepageSection[]) ?? []}
        initialBannersBySection={bannersBySection}
        products={(products as unknown as Product[]) ?? []}
        categories={(categories as unknown as Category[]) ?? []}
        brands={(brands as unknown as Brand[]) ?? []}
      />
    </AdminShell>
  );
}
