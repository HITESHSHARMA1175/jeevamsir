// ============================================
// FILE: app/admin/site/page.tsx
// PURPOSE: Admin - edit site_settings (logo, SEO, WhatsApp)
// USED IN: /admin/site
// INTERN NOTE: Update branding here, not in code.
// ============================================

import AdminShell from "@/components/admin/AdminShell";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import { createClient } from "@/lib/supabase/server";
import type { BrandSettings } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminSite() {
  const supabase = await createClient();
  const [{ data: settings }, { data: brand }] = await Promise.all([
    supabase.from("site_settings").select("*").limit(1).maybeSingle(),
    supabase.from("brand_settings").select("*").limit(1).maybeSingle(),
  ]);
  return (
    <AdminShell title="Site settings">
      <SiteSettingsForm
        initial={settings ?? null}
        brandInitial={(brand as unknown as BrandSettings | null) ?? null}
      />
    </AdminShell>
  );
}

