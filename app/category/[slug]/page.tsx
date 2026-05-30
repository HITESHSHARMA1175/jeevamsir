// ============================================
// FILE: app/category/[slug]/page.tsx
// PURPOSE: Category listing page (grid + stock filter)
// USED IN: Public storefront
// INTERN NOTE: Categories and products are managed in Supabase.
// ============================================

import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import CategoryProductsGrid from "@/components/store/CategoryProductsGrid";
import {
  buildBreadcrumbJsonLd,
  getSeoPageJsonLd,
  getSiteMetadata,
} from "@/utils/store/seo";
import {
  getBrandSettings,
  getCategories,
  getProductsByCategoryAll,
  getProductsByCategorySubcategory,
  getSiteSettings,
  getSubcategories,
} from "@/utils/store/queries";

// PERF: ISR — category pages are cached at the edge for 60s.
export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await getCategories();
  const params = categories.map((c) => ({ slug: c.slug }));
  return params.length > 0 ? params : [{ slug: "electronics" }];
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return await getSiteMetadata(undefined, `/category/${slug}`);

  let title = `${cat.name} | Shop`;
  if (searchParams) {
    const sp = await searchParams;
    const subRaw = sp?.sub;
    const subSlug =
      (Array.isArray(subRaw) ? subRaw[0] : subRaw)?.trim().toLowerCase() ??
      "";
    if (subSlug.length > 0) {
      const subcategories = await getSubcategories();
      const activeSub = subcategories.find(
        (s) =>
          s.slug.toLowerCase() === subSlug &&
          s.category_id === cat.id &&
          s.is_active,
      );
      if (activeSub) title = `${activeSub.name} — ${cat.name} | Shop`;
    }
  }
  return await getSiteMetadata({ title }, `/category/${slug}`);
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const subRaw = sp?.sub;
  const subSlug = (Array.isArray(subRaw) ? subRaw[0] : subRaw)?.trim().toLowerCase() ?? "";

  const [categories, subcategories, settings, brand] = await Promise.all([
    getCategories(),
    getSubcategories(),
    getSiteSettings(),
    getBrandSettings(),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const activeSub =
    subSlug.length > 0
      ? subcategories.find(
          (s) =>
            s.slug.toLowerCase() === subSlug &&
            s.category_id === category.id &&
            s.is_active,
        )
      : undefined;

  const products =
    activeSub !== undefined
      ? await getProductsByCategorySubcategory(category.id, activeSub.id)
      : await getProductsByCategoryAll(category.id);
  const childSubcategories = subcategories.filter((sub) => sub.category_id === category.id && sub.is_active);

  const safeSettings =
    settings ?? {
      id: "missing",
      site_name: "ShopKart",
        logo_url: null,
        meta_title: "ShopKart",
        meta_desc: "ShopKart brings you unbeatable prices across electronics, fashion, and more.",
      og_image: null,
      ga_id: null,
      whatsapp: "7705074250",
      created_at: null,
      updated_at: null,
    };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: category.name, url: `${baseUrl}/category/${category.slug}` },
    ...(activeSub
      ? [
          {
            name: activeSub.name,
            url: `${baseUrl}/category/${category.slug}?sub=${activeSub.slug}`,
          },
        ]
      : []),
  ]);
  const customJsonLd = await getSeoPageJsonLd(`/category/${category.slug}`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {customJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(customJsonLd) }}
        />
      )}
      <Header settings={safeSettings} categories={categories} subcategories={subcategories} />
      <main className="container-pad section-pad">
        <div className="mb-6 space-y-1">
          <h1 className="text-[var(--text-heading)] font-semibold">
            {category.name}
            {activeSub ? (
              <span className="font-normal text-muted-foreground">
                {" "}
                / {activeSub.name}
              </span>
            ) : null}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeSub
              ? `Showing items in ${activeSub.name}`
              : `Browse ${category.name} collection`}
          </p>
          {activeSub && (
            <div className="pt-2">
              <Link
                href={`/category/${category.slug}`}
                className="text-sm font-medium text-[var(--brand-primary)] underline-offset-4 hover:underline"
              >
                Show all {category.name}
              </Link>
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-sm border bg-card p-3 shadow-sm sm:p-4">
              <div className="text-sm font-semibold">Subcategories</div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:grid lg:overflow-visible lg:pb-0">
                <Link
                  href={`/category/${category.slug}`}
                  className={`min-w-max rounded-sm border px-3 py-2 text-sm ${!activeSub ? "border-blue-200 bg-blue-600 text-white" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  All {category.name}
                </Link>
                {childSubcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/category/${category.slug}?sub=${sub.slug}`}
                    className={`min-w-max rounded-sm border px-3 py-2 text-sm ${activeSub?.id === sub.id ? "border-blue-200 bg-blue-600 text-white" : "bg-background text-muted-foreground hover:text-foreground"}`}
                  >
                    {sub.name}
                  </Link>
                ))}
                {childSubcategories.length === 0 && (
                  <div className="text-sm text-muted-foreground">No subcategories yet.</div>
                )}
              </div>
            </div>
          </aside>

          <CategoryProductsGrid
            products={products}
            subcategoryFilterName={activeSub?.name ?? null}
          />
        </div>
      </main>
      <Footer settings={safeSettings} brand={brand} />
    </>
  );
}

