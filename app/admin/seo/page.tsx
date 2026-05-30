// ============================================
// FILE: app/admin/seo/page.tsx
// PURPOSE: Admin SEO control center (Global / Tracking / Per-page / Keywords).
// USED IN: /admin/seo
// ============================================

import AdminShell from "@/components/admin/AdminShell";
import SEOAdmin from "@/components/admin/SEOAdmin";
import { createClient } from "@/lib/supabase/server";
import type { SeoKeyword, SeoPage, SiteSettings } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminSEO() {
  const supabase = await createClient();
  const [{ data: settings }, { data: pages }, { data: keywords }] =
    await Promise.all([
      supabase.from("site_settings").select("*").maybeSingle(),
      supabase
        .from("seo_pages")
        .select("*")
        .order("path", { ascending: true }),
      supabase
        .from("seo_keywords")
        .select("*")
        .order("keyword", { ascending: true }),
    ]);

  return (
    <AdminShell title="SEO">
      <SEOAdmin
        settings={(settings as unknown as SiteSettings) ?? null}
        pages={((pages as unknown) as SeoPage[]) ?? []}
        keywords={((keywords as unknown) as SeoKeyword[]) ?? []}
      />
    </AdminShell>
  );
}
