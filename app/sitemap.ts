// ============================================
// FILE: app/sitemap.ts
// PURPOSE: Generate sitemap.xml for SEO
// USED IN: Next.js metadata routes
// ============================================

import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/utils/store/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jeewanom.com";
  const now = new Date().toISOString();

  const [slugs, categories] = await Promise.all([getAllProductSlugs(), getCategories()]);

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...categories.map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...slugs.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
