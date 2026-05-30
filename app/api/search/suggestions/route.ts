import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CategoryRow = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  is_active: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sell_price: number | null;
  brand_name: string | null;
  brand?: { name: string | null } | null;
};

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function escapeLike(value: string) {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export async function GET(request: Request) {
  const supabase = getPublicClient();
  if (!supabase) return NextResponse.json({ suggestions: [] });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const like = `%${escapeLike(q)}%`;

  const [productsResult, categoriesResult, brandsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, image_url, sell_price, brand_name, brand:brands(name)")
      .eq("in_stock", true)
      .or(`name.ilike.${like},brand_name.ilike.${like}`)
      .limit(6),
    supabase
      .from("categories")
      .select("id, parent_id, name, slug, is_active")
      .eq("is_active", true)
      .ilike("name", like)
      .limit(12),
    supabase
      .from("brands")
      .select("id, name, slug")
      .eq("is_active", true)
      .ilike("name", like)
      .limit(4),
  ]);

  const allCategoryIds = new Set<string>();
  const matchedCategories = ((categoriesResult.data ?? []) as CategoryRow[]).filter((category) => {
    allCategoryIds.add(category.id);
    if (category.parent_id) allCategoryIds.add(category.parent_id);
    return true;
  });

  const { data: relatedCategories } = allCategoryIds.size
    ? await supabase
        .from("categories")
        .select("id, parent_id, name, slug, is_active")
        .in("id", Array.from(allCategoryIds))
    : { data: [] };

  const categoryById = new Map(
    ((relatedCategories ?? []) as CategoryRow[]).map((category) => [category.id, category]),
  );

  const productSuggestions = ((productsResult.data ?? []) as unknown as ProductRow[]).map(
    (product) => ({
      id: product.id,
      type: "product",
      label: product.name,
      subtitle: product.brand?.name ?? product.brand_name ?? "Product",
      href: `/products/${product.slug}`,
      imageUrl: product.image_url,
      price: product.sell_price,
    }),
  );

  const categorySuggestions = matchedCategories.map((category) => {
    const parent = category.parent_id ? categoryById.get(category.parent_id) : null;
    return {
      id: category.id,
      type: parent ? "subcategory" : "category",
      label: category.name,
      subtitle: parent ? `In ${parent.name}` : "Category",
      href: parent
        ? `/category/${parent.slug}?sub=${category.slug}`
        : `/category/${category.slug}`,
      imageUrl: null,
      price: null,
    };
  });

  const brandSuggestions = (brandsResult.data ?? []).map((brand) => ({
    id: brand.id,
    type: "brand",
    label: brand.name,
    subtitle: "Brand",
    href: `/?q=${encodeURIComponent(brand.name)}`,
    imageUrl: null,
    price: null,
  }));

  return NextResponse.json({
    suggestions: [...productSuggestions, ...categorySuggestions, ...brandSuggestions].slice(0, 10),
  });
}

