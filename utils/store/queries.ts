// ============================================
// FILE: utils/store/queries.ts
// PURPOSE: Server-only Supabase queries for the store
// USED IN: app/page.tsx, app/products/[slug], app/category/[slug], sitemap
// INTERN NOTE: Add new query functions at the bottom of this file.
// ============================================

// 🔴 SERVER ONLY — All functions use server Supabase client
// ✅ INTERN: Add new query functions at the bottom of this file
// ⚡️ PERF: Lookups that rarely change (site settings, categories, brand
// settings) are wrapped in React `cache()` so the same render request
// only ever fetches them once.

import { cache } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  Banner,
  Blog,
  Brand,
  BrandSettings,
  Category,
  CategoryTreeNode,
  HomepageSection,
  Product,
  ProductReviewStats,
  SeoPage,
  Subcategory,
  SiteSettings,
} from "@/types";

const PRODUCT_SELECT = "*, brand:brands(*)";

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeProductRow(row: unknown): Product {
  const base = row as unknown as Product & { image_gallery?: unknown; tags?: unknown };
  const brand = base.brand ?? null;
  return {
    ...(base as Product),
    brand,
    brand_name: base.brand_name ?? brand?.name ?? null,
    image_gallery: safeArray<string>(base.image_gallery),
    tags: safeArray<string>(base.tags),
  };
}

function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const byId = new Map<string, CategoryTreeNode>();
  categories.forEach((category) => {
    byId.set(category.id, { ...category, children: [], depth: 0 });
  });

  const roots: CategoryTreeNode[] = [];
  byId.forEach((node) => {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent) {
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortTree = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    nodes.forEach((node) => {
      node.children.forEach((child) => {
        child.depth = node.depth + 1;
      });
      sortTree(node.children);
    });
  };
  sortTree(roots);
  return roots;
}

function collectCategoryIds(categories: Category[], rootId: string): string[] {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    categories.forEach((category) => {
      if (category.parent_id && ids.has(category.parent_id) && !ids.has(category.id)) {
        ids.add(category.id);
        changed = true;
      }
    });
  }
  return Array.from(ids);
}

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * getSiteSettings
 * Fetches the single site_settings row.
 * Wrapped in React `cache()` so multiple components on the same render
 * share a single fetch.
 * @returns SiteSettings or null if missing/error
 */
export const getSiteSettings = cache(
  async (): Promise<SiteSettings | null> => {
    try {
      const supabase = getPublicClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .single();
      if (error || !data) return null;
      return data as unknown as SiteSettings;
    } catch (error) {
      console.error("[getSiteSettings] error:", error);
      return null;
    }
  },
);

/**
 * getBannersByPlacement
 * Fetches active homepage banners for a given placement ordered by sort_order.
 * @returns Banner[]
 */
export async function getBannersByPlacement(placement: NonNullable<Banner["placement"]>): Promise<Banner[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .eq("placement", placement)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as unknown as Banner[];
  } catch (error) {
    console.error("[getBannersByPlacement] error:", error);
    return [];
  }
}

/**
 * getBanners
 * Convenience wrapper for hero banners used by the main carousel.
 * @returns Banner[]
 */
export async function getBanners(): Promise<Banner[]> {
  return await getBannersByPlacement("hero");
}

/**
 * getCategories
 * Fetches active root categories ordered by sort_order. Cached per request.
 * @returns Category[]
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as unknown as Category[];
  } catch (error) {
    console.error("[getCategories] error:", error);
    return [];
  }
});

export const getAllCategories = cache(async (): Promise<Category[]> => {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as unknown as Category[];
  } catch (error) {
    console.error("[getAllCategories] error:", error);
    return [];
  }
});

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const categories = await getAllCategories();
  return buildCategoryTree(categories);
}

export async function getBrands(): Promise<Brand[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data) return [];
    return data as unknown as Brand[];
  } catch (error) {
    console.error("[getBrands] error:", error);
    return [];
  }
}

async function getProductsForHomepageSection(
  section: HomepageSection,
): Promise<Product[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];

    if (section.product_source === "manual") {
      const { data: links, error: linksError } = await supabase
        .from("homepage_section_products")
        .select("product_id, sort_order")
        .eq("section_id", section.id)
        .order("sort_order", { ascending: true });
      if (linksError || !links || links.length === 0) return [];

      const orderedIds = (links as { product_id: string; sort_order: number }[]).map(
        (link) => link.product_id,
      );
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .in("id", orderedIds)
        .eq("in_stock", true);
      if (error || !data) return [];

      const byId = new Map(
        (data as unknown[]).map((row) => {
          const product = normalizeProductRow(row);
          return [product.id, product];
        }),
      );
      return orderedIds
        .map((id) => byId.get(id))
        .filter((product): product is Product => Boolean(product))
        .slice(0, section.max_items);
    }

    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("in_stock", true)
      .limit(section.max_items);

    if (section.product_source === "featured") {
      query = query.eq("is_featured", true).order("sort_order", { ascending: true });
    } else if (section.product_source === "new_arrivals") {
      query = query.order("created_at", { ascending: false });
    } else if (section.product_source === "category" && section.category_id) {
      const categoryIds = collectCategoryIds(await getAllCategories(), section.category_id);
      query = query.in("category_id", categoryIds).order("sort_order", { ascending: true });
    } else if (section.product_source === "brand" && section.brand_id) {
      query = query.eq("brand_id", section.brand_id).order("sort_order", { ascending: true });
    } else {
      return [];
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return (data as unknown[]).map(normalizeProductRow);
  } catch (error) {
    console.error("[getProductsForHomepageSection] error:", error);
    return [];
  }
}

async function getBannersForSection(sectionId: string): Promise<Banner[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .eq("section_id", sectionId)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as unknown as Banner[];
  } catch (error) {
    console.error("[getBannersForSection] error:", error);
    return [];
  }
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("*, category:categories(*), brand:brands(*)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];

    const sections = data as unknown as HomepageSection[];
    return await Promise.all(
      sections.map(async (section) => {
        if (section.section_type === "products") {
          return {
            ...section,
            products: await getProductsForHomepageSection(section),
            banners: [],
          };
        }
        if (section.section_type === "banner") {
          return {
            ...section,
            products: [],
            banners: await getBannersForSection(section.id),
          };
        }
        return { ...section, products: [], banners: [] };
      }),
    );
  } catch (error) {
    console.error("[getHomepageSections] error:", error);
    return [];
  }
}

/**
 * getSubcategories
 * Compatibility helper: returns non-root category tree nodes as subcategories.
 * @returns Subcategory[]
 */
export const getSubcategories = cache(async (): Promise<Subcategory[]> => {
  try {
    const categories = await getAllCategories();
    return categories
      .filter((category) => category.parent_id)
      .map((category) => ({
        id: category.id,
        category_id: category.parent_id as string,
        name: category.name,
        slug: category.slug,
        image_url: category.image_url,
        sort_order: category.sort_order,
        is_active: category.is_active,
        created_at: category.created_at,
      }));
  } catch (error) {
    console.error("[getSubcategories] error:", error);
    return [];
  }
});

/**
 * getProducts
 * Fetches in-stock products ordered by sort_order.
 * @returns Product[]
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("in_stock", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return (data as unknown[]).map(normalizeProductRow);
  } catch (error) {
    console.error("[getProducts] error:", error);
    return [];
  }
}

/**
 * getProductBySlug
 * Fetches a product by slug with category join.
 * @returns Product or null
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return normalizeProductRow(data);
  } catch (error) {
    console.error("[getProductBySlug] error:", error);
    return null;
  }
}

/**
 * getProductsByCategory
 * Fetches in-stock products by category_id.
 * @returns Product[]
 */
export async function getProductsByCategory(
  categoryId: string,
): Promise<Product[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const categoryIds = collectCategoryIds(await getAllCategories(), categoryId);
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("category_id", categoryIds)
      .eq("in_stock", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return (data as unknown[]).map(normalizeProductRow);
  } catch (error) {
    console.error("[getProductsByCategory] error:", error);
    return [];
  }
}

/**
 * getProductsByCategoryAll
 * Fetches all products by category_id (including out of stock).
 * @returns Product[]
 */
export async function getProductsByCategoryAll(
  categoryId: string,
): Promise<Product[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const categoryIds = collectCategoryIds(await getAllCategories(), categoryId);
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("category_id", categoryIds)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return (data as unknown[]).map(normalizeProductRow);
  } catch (error) {
    console.error("[getProductsByCategoryAll] error:", error);
    return [];
  }
}

/**
 * getProductsByCategorySubcategory
 * Fetches products narrowed to a child category tree node.
 */
export async function getProductsByCategorySubcategory(
  _categoryId: string,
  subcategoryId: string,
): Promise<Product[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const categoryIds = collectCategoryIds(await getAllCategories(), subcategoryId);
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("category_id", categoryIds)
      .order("sort_order", { ascending: true });
    if (error || !data) {
      if (error) console.error("[getProductsByCategorySubcategory] error:", error);
      return [];
    }
    return (data as unknown[]).map(normalizeProductRow);
  } catch (error) {
    console.error("[getProductsByCategorySubcategory] error:", error);
    return [];
  }
}

/**
 * getFeaturedProducts
 * Fetches featured products.
 * @param limit - default 8
 * @returns Product[]
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_featured", true)
      .eq("in_stock", true)
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return (data as unknown[]).map(normalizeProductRow);
  } catch (error) {
    console.error("[getFeaturedProducts] error:", error);
    return [];
  }
}

/**
 * getAllProductSlugs
 * Fetches all product slugs for generateStaticParams/sitemap.
 * @returns Array of { slug }
 */
export async function getAllProductSlugs(): Promise<{ slug: string }[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("products")
      .select("slug")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as unknown as { slug?: unknown }[]).flatMap((r) =>
      typeof r.slug === "string" ? [{ slug: r.slug }] : [],
    );
  } catch (error) {
    console.error("[getAllProductSlugs] error:", error);
    return [];
  }
}

/**
 * getRelatedProducts
 * Fetches related products from same category, excluding one id.
 * @param limit - default 4
 * @returns Product[]
 */
export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4,
): Promise<Product[]> {
  if (!categoryId) return [];
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("category_id", categoryId)
      .neq("id", excludeId)
      .eq("in_stock", true)
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return (data as unknown[]).map(normalizeProductRow);
  } catch (error) {
    console.error("[getRelatedProducts] error:", error);
    return [];
  }
}

/**
 * getBrandSettings
 * Fetches brand_settings row (if present). Cached per request.
 * @returns BrandSettings or null
 */
export const getBrandSettings = cache(
  async (): Promise<BrandSettings | null> => {
    try {
      const supabase = getPublicClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from("brand_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      return data as unknown as BrandSettings;
    } catch (error) {
      console.error("[getBrandSettings] error:", error);
      return null;
    }
  },
);

/**
 * getSeoPageOverride
 * Fetches per-path SEO overrides if any.
 */
export const getSeoPageOverride = cache(
  async (path: string): Promise<SeoPage | null> => {
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
    } catch (error) {
      console.error("[getSeoPageOverride] error:", error);
      return null;
    }
  },
);

/**
 * getProductReviewStats
 * Aggregated avg + count from `product_review_stats` view.
 */
export async function getProductReviewStats(
  productIds: string[],
): Promise<Map<string, ProductReviewStats>> {
  const map = new Map<string, ProductReviewStats>();
  if (productIds.length === 0) return map;
  try {
    const supabase = getPublicClient();
    if (!supabase) return map;
    const { data, error } = await supabase
      .from("product_review_stats")
      .select("*")
      .in("product_id", productIds);
    if (error || !data) return map;
    (data as unknown as ProductReviewStats[]).forEach((row) => {
      map.set(row.product_id, row);
    });
    return map;
  } catch (error) {
    console.error("[getProductReviewStats] error:", error);
    return map;
  }
}

/**
 * getApprovedReviewsForProduct
 * Public list of approved reviews for the product page.
 */
export async function getApprovedReviewsForProduct(
  productId: string,
  limit = 50,
) {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as unknown as import("@/types").ProductReview[];
  } catch (error) {
    console.error("[getApprovedReviewsForProduct] error:", error);
    return [];
  }
}

/**
 * getBlogs
 * Fetches active blog posts ordered by sort_order for homepage carousel.
 * @returns Blog[]
 */
export async function getBlogs(limit = 6): Promise<Blog[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return data as unknown as Blog[];
  } catch (error) {
    console.error("[getBlogs] error:", error);
    return [];
  }
}

/**
 * getFeaturedBlogs
 * Fetches featured blog posts for promotional display.
 * @returns Blog[]
 */
export async function getFeaturedBlogs(limit = 3): Promise<Blog[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("is_active", true)
      .eq("featured", true)
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return data as unknown as Blog[];
  } catch (error) {
    console.error("[getFeaturedBlogs] error:", error);
    return [];
  }
}
