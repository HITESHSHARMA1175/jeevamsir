// ============================================
// FILE: app/sitemap.ts
// PURPOSE: Generate sitemap.xml for SEO
// USED IN: Next.js metadata routes
// INTERN NOTE: Set NEXT_PUBLIC_SITE_URL in .env.local for correct URLs.
// ============================================

import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/utils/store/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [slugs, categories] = await Promise.all([getAllProductSlugs(), getCategories()]);

  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...categories.map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...slugs.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

