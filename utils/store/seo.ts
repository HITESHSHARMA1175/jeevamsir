// ============================================
// FILE: utils/store/seo.ts
// PURPOSE: Site + per-path metadata helpers (server-only).
// USED IN: generateMetadata() in app routes, app/layout.tsx.
// INTERN NOTE: Edit defaults from /admin/seo (Global tab); add
//              path-specific overrides in /admin/seo (Per-page tab).
// PRECEDENCE (highest to lowest):
//   1. seo_pages row matching the request pathname  (admin Per-page)
//   2. overrides arg passed by the page              (e.g. product meta)
//   3. site_settings defaults                        (admin Global)
//   4. hardcoded fallback                            ("Techpotli Store")
// The previous implementation had per-path AFTER overrides AND ended
// the merged object with `...overrides` which clobbered everything.
// That made admin per-page SEO silently a no-op.
// ============================================

// 🔴 SERVER ONLY — Never import this in 'use client' components

import type { Metadata } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Product, SeoPage, SiteSettings } from "@/types";

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function asStringTitle(title: Metadata["title"]): string | null {
  if (!title) return null;
  if (typeof title === "string") return title;
  if ("absolute" in title && typeof title.absolute === "string")
    return title.absolute;
  if ("default" in title && typeof title.default === "string")
    return title.default;
  return null;
}

function nonEmpty(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function fetchSeoPage(path: string): Promise<SeoPage | null> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("seo_pages")
      .select("*")
      .eq("path", path)
      .maybeSingle();
    if (error || !data) return null;
    return data as unknown as SeoPage;
  } catch (e) {
    console.error("[fetchSeoPage] error:", e);
    return null;
  }
}

/**
 * getSiteMetadata
 * Build a Metadata object combining (highest priority first):
 *   1. seo_pages row (admin per-page override)
 *   2. overrides arg (page-level meta, e.g. buildProductMetadata)
 *   3. site_settings defaults
 */
export async function getSiteMetadata(
  overrides?: Partial<Metadata>,
  pathname?: string,
): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const supabase = getPublicClient();
    let settings: SiteSettings | null = null;
    if (supabase) {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .single();
      settings = (data as unknown as SiteSettings) ?? null;
    }

    const seoPage = pathname ? await fetchSeoPage(pathname) : null;

    const overrideTitle = asStringTitle(overrides?.title);
    const overrideDesc =
      typeof overrides?.description === "string"
        ? overrides.description
        : null;
    const overrideOg =
      overrides?.openGraph && typeof overrides.openGraph === "object"
        ? (overrides.openGraph as {
            title?: string;
            description?: string;
            images?: (string | { url: string })[];
          })
        : null;
    const overrideOgTitle =
      typeof overrideOg?.title === "string" ? overrideOg.title : null;
    const overrideOgDesc =
      typeof overrideOg?.description === "string"
        ? overrideOg.description
        : null;
    const overrideOgImages = Array.isArray(overrideOg?.images)
      ? (overrideOg!.images as (string | { url: string })[])
      : null;
    const overrideKeywords = Array.isArray(overrides?.keywords)
      ? (overrides!.keywords as string[])
      : null;

    // Resolve each field with seo_pages > overrides > site_settings > fallback.
    const title =
      nonEmpty(seoPage?.title) ??
      nonEmpty(overrideTitle) ??
      nonEmpty(settings?.meta_title) ??
      nonEmpty(settings?.site_name) ??
      "Ayurveda Store";

    const description =
      nonEmpty(seoPage?.description) ??
      nonEmpty(overrideDesc) ??
      nonEmpty(settings?.meta_desc) ??
      "Discover authentic Ayurveda essentials.";

    const ogImage =
      nonEmpty(seoPage?.og_image) ??
      (overrideOgImages && overrideOgImages.length > 0
        ? typeof overrideOgImages[0] === "string"
          ? (overrideOgImages[0] as string)
          : (overrideOgImages[0] as { url: string }).url
        : null) ??
      nonEmpty(settings?.og_image);

    const ogTitle =
      nonEmpty(seoPage?.og_title) ??
      nonEmpty(overrideOgTitle) ??
      nonEmpty(settings?.default_og_title) ??
      title;

    const ogDesc =
      nonEmpty(seoPage?.og_desc) ??
      nonEmpty(overrideOgDesc) ??
      nonEmpty(settings?.default_og_desc) ??
      description;

    const keywords =
      (seoPage?.keywords && seoPage.keywords.length > 0
        ? seoPage.keywords
        : null) ??
      (overrideKeywords && overrideKeywords.length > 0
        ? overrideKeywords
        : null) ??
      (settings?.meta_keywords && settings.meta_keywords.length > 0
        ? settings.meta_keywords
        : null);

    const robotsIndex =
      seoPage?.robots_index ?? settings?.robots_index_default ?? true;

    const verification: Metadata["verification"] = {};
    if (settings?.gsc_verification) {
      verification.google = settings.gsc_verification;
    }
    if (settings?.bing_verification) {
      verification.other = {
        ...(verification.other ?? {}),
        "msvalidate.01": settings.bing_verification,
      };
    }

    const merged: Metadata = {
      metadataBase: new URL(baseUrl),
      title,
      description,
      keywords: keywords && keywords.length > 0 ? keywords : undefined,
      alternates: seoPage?.canonical_url
        ? { canonical: seoPage.canonical_url }
        : undefined,
      openGraph: {
        title: ogTitle,
        description: ogDesc,
        images: ogImage ? [ogImage] : [],
      },
      twitter: { card: "summary_large_image" },
      robots: {
        index: robotsIndex,
        follow: robotsIndex,
      },
      verification:
        Object.keys(verification).length > 0 ? verification : undefined,
    };

    return merged;
  } catch (error) {
    console.error("[getSiteMetadata] error:", error);
    return {
      metadataBase: new URL(baseUrl),
      title: asStringTitle(overrides?.title) ?? "Ayurveda Store",
      description:
        (overrides?.description as string | undefined) ?? "Discover authentic Ayurveda essentials.",
      robots: { index: true, follow: true },
    };
  }
}

/**
 * getSeoPageJsonLd
 * Returns the per-path JSON-LD object (or null) so a page can render it
 * alongside its product/breadcrumb structured data.
 */
export async function getSeoPageJsonLd(
  pathname: string,
): Promise<Record<string, unknown> | null> {
  const seoPage = await fetchSeoPage(pathname);
  if (!seoPage?.json_ld) return null;
  if (typeof seoPage.json_ld !== "object") return null;
  return seoPage.json_ld as Record<string, unknown>;
}

function truncateTo160(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 160) return normalized;
  return normalized.slice(0, 157).trimEnd() + "...";
}

/**
 * buildProductMetadata
 * Builds Metadata for a product detail page.
 * Fallback chain: product.meta_title → product.name → site_settings
 */
export function buildProductMetadata(
  product: Product,
  siteSettings: SiteSettings,
): Metadata {
  const title =
    product.meta_title?.trim() ||
    product.name ||
    siteSettings.meta_title ||
    siteSettings.site_name;

  const descSource =
    product.meta_desc?.trim() ||
    product.description?.trim() ||
    siteSettings.meta_desc ||
    "";

  const description = truncateTo160(descSource);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
    twitter: { card: "summary_large_image" },
    robots: {
      index: siteSettings.robots_index_default ?? true,
      follow: siteSettings.robots_index_default ?? true,
    },
  };
}

/**
 * buildBreadcrumbJsonLd
 * Helper for category/product breadcrumbs (BreadcrumbList).
 */
export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * buildProductJsonLd
 * Helper for Product + AggregateRating + Offer JSON-LD.
 */
export function buildProductJsonLd(
  product: Product,
  options: {
    siteUrl: string;
    avgRating?: number | null;
    reviewCount?: number | null;
  },
) {
  const url = `${options.siteUrl.replace(/\/$/, "")}/products/${product.slug}`;
  const images = [product.image_url, ...(product.image_gallery ?? [])].filter(Boolean);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    sku: product.id,
    image: images,
    url,
    brand: product.brand_name
      ? { "@type": "Brand", name: product.brand_name }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: Number(product.sell_price),
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url,
    },
  };
  if (options.reviewCount && options.avgRating) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(options.avgRating).toFixed(1),
      reviewCount: options.reviewCount,
    };
  }
  return node;
}
