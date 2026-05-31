// ============================================
// FILE: app/products/[slug]/page.tsx
// PURPOSE: Product detail page (gallery, pricing, cart, WhatsApp)
// USED IN: Public storefront
// INTERN NOTE: Product content comes from Supabase `products`.
// ============================================

import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ImageGallery from "@/components/store/ImageGallery";
import PriceBadge from "@/components/store/PriceBadge";
import AddToCartButton from "@/components/store/AddToCartButton";
import ProductOptionsPicker from "@/components/store/ProductOptionsPicker";
import ProductReviews from "@/components/store/ProductReviews";
import WishlistHeart from "@/components/store/WishlistHeart";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  buildProductMetadata,
  getSeoPageJsonLd,
  getSiteMetadata,
} from "@/utils/store/seo";
import {
  getAllProductSlugs,
  getApprovedReviewsForProduct,
  getBrandSettings,
  getCategories,
  getProductBySlug,
  getProductReviewStats,
  getRelatedProducts,
  getSiteSettings,
  getSubcategories,
} from "@/utils/store/queries";
import ProductCard from "@/components/store/ProductCard";
import {
  getDiscountPercent,
  getSavingsAmount,
  hasDiscount,
} from "@/utils/store/formatPrice";

// PERF: ISR — pages are cached for 60s and revalidated in background.
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  const params = slugs.map((s) => ({ slug: s.slug }));
  return params.length > 0 ? params : [{ slug: "sample-product" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const settings = await getSiteSettings();
  if (!product || !settings) return await getSiteMetadata(undefined, `/products/${slug}`);
  const productMeta = buildProductMetadata(product, settings);
  // Merge per-path overrides on top of the product metadata defaults.
  return await getSiteMetadata(productMeta, `/products/${slug}`);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, categories, subcategories, settings, brand] = await Promise.all([
    getProductBySlug(slug),
    getCategories(),
    getSubcategories(),
    getSiteSettings(),
    getBrandSettings(),
  ]);

  if (!product) notFound();

  const [reviewStatsMap, reviews] = await Promise.all([
    getProductReviewStats([product.id]),
    getApprovedReviewsForProduct(product.id, 50),
  ]);
  const reviewStats = reviewStatsMap.get(product.id) ?? null;
  const attributes = Array.isArray(product.attributes) ? product.attributes : [];

  const safeSettings =
    settings ?? {
      id: "missing",
      site_name: "Ayurveda Store",
      logo_url: null,
      meta_title: "Ayurveda Store",
      meta_desc: "Discover authentic Ayurveda essentials.",
      og_image: null,
      ga_id: null,
      whatsapp: "7705074250",
      created_at: null,
      updated_at: null,
    };

  const related = await getRelatedProducts(product.category_id, product.id);

  const images = [
    { url: product.image_url, alt: product.name },
    ...(product.image_gallery ?? []).map((url, i) => ({
      url,
      alt: `${product.name} ${i + 2}`,
    })),
  ];

  const discounted = hasDiscount(product.mrp_price, product.sell_price);
  const percent = discounted ? getDiscountPercent(product.mrp_price, product.sell_price) : 0;
  const savings = discounted ? getSavingsAmount(product.mrp_price, product.sell_price) : null;

  const category = product.category ?? categories.find((c) => c.id === product.category_id) ?? null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    ...(category
      ? [
          {
            name: category.name,
            url: `${baseUrl}/category/${category.slug}`,
          },
        ]
      : []),
    {
      name: product.name,
      url: `${baseUrl}/products/${product.slug}`,
    },
  ]);
  const productJsonLd = buildProductJsonLd(product, {
    siteUrl: baseUrl,
    avgRating: reviewStats?.avg_rating ?? null,
    reviewCount: reviewStats?.review_count ?? null,
  });
  const customJsonLd = await getSeoPageJsonLd(`/products/${product.slug}`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {customJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(customJsonLd) }}
        />
      )}
      <Header settings={safeSettings} categories={categories} subcategories={subcategories} />

      <main className="container-pad section-pad">
        <div className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          /{" "}
          {category ? (
            <Link href={`/category/${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
          ) : (
            <span>Products</span>
          )}{" "}
          / <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <div className="lg:sticky lg:top-24">
            <ImageGallery images={images} priority />
          </div>

          <div className="space-y-5">
            {category && (
              <Link
                href={`/category/${category.slug}`}
                className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {category.name}
              </Link>
            )}

            {(product.brand?.name || product.brand_name) && (
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {product.brand?.name ?? product.brand_name}
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[var(--text-heading)] font-semibold leading-tight">
                {product.name}
              </h1>
              <WishlistHeart productId={product.id} />
            </div>

            {reviewStats && reviewStats.review_count > 0 && (
              <div className="text-sm text-muted-foreground">
                <span className="rounded-sm bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                  {Number(reviewStats.avg_rating ?? 0).toFixed(1)} ★
                </span>{" "}
                {reviewStats.review_count} review
                {reviewStats.review_count === 1 ? "" : "s"}
              </div>
            )}

            <PriceBadge mrp={product.mrp_price} sell={product.sell_price} size="lg" />
            {discounted && savings && (
              <div className="text-sm text-muted-foreground">
                You save <span className="font-semibold text-foreground">{savings}</span>{" "}
                ({percent}%)
              </div>
            )}

            <div className="max-w-sm">
              {attributes.length > 0 ? (
                <ProductOptionsPicker
                  product={product}
                  attributes={attributes}
                />
              ) : (
                <AddToCartButton product={product} />
              )}
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-soft">
              <div className="text-sm font-semibold">Need help?</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Chat on WhatsApp for size, delivery, or availability.
              </div>
              <div className="mt-3">
                <WhatsAppButton
                  phone={safeSettings.whatsapp}
                  productName={product.name}
                  sellPrice={product.sell_price}
                  productUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/products/${product.slug}`}
                />
              </div>
            </div>

            {product.description && (
              <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground">
                {product.description}
              </div>
            )}
          </div>
        </div>

        <ProductReviews
          productId={product.id}
          stats={reviewStats}
          initialReviews={reviews}
        />

        {related.length > 0 && category && (
          <section className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text-subheading)] font-semibold tracking-tight">
                More from {category.name}
              </h2>
              <Link
                href={`/category/${category.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                See all →
              </Link>
            </div>
            <div className="scroll-container pr-10">
              {related.map((p, i) => (
                <div key={p.id} className="scroll-item min-w-[200px] sm:min-w-[220px]">
                  <ProductCard product={p} priority={i < 4} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer settings={safeSettings} brand={brand} />
    </>
  );
}

