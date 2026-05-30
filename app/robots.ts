// ============================================
// FILE: app/robots.ts
// PURPOSE: Generate robots.txt. Honors the
//          `site_settings.robots_index_default` toggle so SEO
//          team can flip the entire site to noindex pre-launch.
// USED IN: Next.js metadata routes
// ============================================

import type { MetadataRoute } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const revalidate = 60;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let allow = true;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && key) {
      const supabase = createSupabaseClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await supabase
        .from("site_settings")
        .select("robots_index_default")
        .maybeSingle();
      if (data && typeof data.robots_index_default === "boolean") {
        allow = data.robots_index_default;
      }
    }
  } catch {
    // Fall through to default (allow all).
  }

  return {
    rules: allow
      ? [
          {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/account", "/auth", "/api"],
          },
        ]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
