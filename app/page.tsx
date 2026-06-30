// ============================================
// FILE: app/page.tsx
// PURPOSE: Store homepage (banners, featured, category rows)
// USED IN: Public storefront
// INTERN NOTE: Add/edit content in Supabase tables (products, banners, etc.)
// ============================================

import Carousel from "@/components/store/Carousel";
import CategoryStrip from "@/components/store/CategoryStrip";
import CategoryRow from "@/components/store/CategoryRow";
import Footer from "@/components/store/Footer";
import Header from "@/components/store/Header";
import HomepageSectionRenderer from "@/components/store/HomepageSectionRenderer";
import MiddleBannerSection from "@/components/store/MiddleBannerSection";
import ProductCard from "@/components/store/ProductCard";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import type { Product } from "@/types";
import { getSeoPageJsonLd, getSiteMetadata } from "@/utils/store/seo";
import {
  getBanners,
  getBannersByPlacement,
  getBrandSettings,
  getCategories,
  getFeaturedProducts,
  getHomepageSections,
  getProducts,
  getSubcategories,
  getSiteSettings,
} from "@/utils/store/queries";

// ✅ PERF: Uses Promise.all for parallel fetching + ISR revalidation
// so the homepage HTML is cached at the edge and refreshed in the
// background. Use a revalidate webhook/admin save to bust the cache.
export const revalidate = 60;
export async function generateMetadata() {
  const baseMeta = await getSiteMetadata(undefined, "/");
  // Enhance homepage with Ayurveda-focused SEO keywords
  return {
    ...baseMeta,
    title: baseMeta.title || "Jeewanom Ayurveda – Buy Authentic Ayurvedic Products Online in India",
    description: baseMeta.description || "Shop genuine Ayurvedic medicines, herbal supplements, immunity boosters, digestive care, skin care, hair care products, herbal powders & teas. Free delivery across India. Triphala Churna, Ashwagandha, Giloy, Amla & more.",
    keywords: [
      "ayurvedic products online",
      "buy ayurvedic medicine India",
      "herbal supplements",
      "immunity booster ayurveda",
      "digestive care products",
      "ayurvedic skin care",
      "ayurvedic hair care",
      "herbal powder churna",
      "herbal tea India",
      "triphala churna",
      "ashwagandha",
      "giloy",
      "amla",
      "neem products",
      "natural wellness products India",
      "jeewanom ayurveda",
      "authentic ayurveda online store",
      "ayurvedic medicine online shopping",
      "herbal face pack",
      "digestive herbal tea",
    ],
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const qRaw = sp?.q;
  const q = (Array.isArray(qRaw) ? qRaw[0] : qRaw)?.trim() ?? "";
  const qLower = q.toLowerCase();

  const [
    banners,
    middleBanners,
    campaignBanners,
    categories,
    subcategories,
    allProducts,
    featuredProducts,
    homepageSections,
    settings,
    brand,
  ] =
    await Promise.all([
      getBanners(),
      getBannersByPlacement("middle"),
      getBannersByPlacement("campaign"),
      getCategories(),
      getSubcategories(),
      getProducts(),
      getFeaturedProducts(),
      getHomepageSections(),
      getSiteSettings(),
      getBrandSettings(),
    ]);

  const safeSettings = settings ?? {
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

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const subcategoryNameById = new Map(
    subcategories.map((subcategory) => [subcategory.id, subcategory.name]),
  );

  const matchesQuery = (p: Product) => {
    if (!qLower) return true;
    const name = (p.name ?? "").toLowerCase();
    const tags = (p.tags ?? []).join(" ").toLowerCase();
    const brand = (p.brand?.name ?? p.brand_name ?? "").toLowerCase();
    const category = p.category_id
      ? (categoryNameById.get(p.category_id) ?? "").toLowerCase()
      : "";
    const subcategory = p.subcategory_id
      ? (subcategoryNameById.get(p.subcategory_id) ?? "").toLowerCase()
      : "";
    return [name, tags, brand, category, subcategory].some((value) =>
      value.includes(qLower),
    );
  };

  const filteredAllProducts = qLower ? allProducts.filter(matchesQuery) : allProducts;
  const filteredFeatured = qLower
    ? featuredProducts.filter(matchesQuery)
    : featuredProducts;

  const productsByCategory = new Map<string, Product[]>();
  filteredAllProducts.forEach((p) => {
    if (!p.category_id) return;
    const list = productsByCategory.get(p.category_id) ?? [];
    list.push(p);
    productsByCategory.set(p.category_id, list);
  });

  const customJsonLd = await getSeoPageJsonLd("/");

  return (
    <>
      {customJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(customJsonLd) }}
        />
      )}
      <Header settings={safeSettings} categories={categories} subcategories={subcategories} query={q} />
      <main className="flex flex-col gap-4 sm:gap-6">
        <CategoryStrip
          categories={categories}
          promoImageUrl={banners[0]?.image_url ?? null}
          promoLink={banners[0]?.click_url ?? null}
        />
        <div className="w-full">
          <Carousel banners={banners} />
        </div>

        {middleBanners.length > 0 && <MiddleBannerSection banners={middleBanners} />}
        {campaignBanners.length > 0 && <MiddleBannerSection banners={campaignBanners} />}

        {qLower && (
          <section className="container-pad pt-2">
            <div className="rounded-sm border border-blue-100 bg-white/80 p-4 shadow-sm">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredAllProducts.length}</span>{" "}
                Ayurveda results for <span className="font-semibold text-foreground">{q}</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {filteredAllProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
            {filteredAllProducts.length === 0 && (
              <div className="mt-5 rounded-sm border bg-white/80 p-8 text-center text-sm text-muted-foreground">
                No products found. Try another herb, remedy, brand, or category name.
              </div>
            )}
          </section>
        )}

        {!qLower && homepageSections.length > 0 && (
          <HomepageSectionRenderer sections={homepageSections} />
        )}

        {!qLower && homepageSections.length === 0 && (
          <>
            {filteredFeatured.length > 0 && (
              <section className="container-pad section-pad space-y-4">
                <div>
                  <h2 className="text-[var(--text-subheading)] font-semibold tracking-tight">
                    Ayurveda picks
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Curated wellness essentials for daily balance
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredFeatured.map((p, i) => (
                    <ProductCard key={p.id} product={p} priority={i < 4} />
                  ))}
                </div>
              </section>
            )}

            <div className="flex flex-col gap-10">
              {categories.map((cat) => (
                <div key={cat.id} className="container-pad">
                  <CategoryRow
                    category={cat}
                    products={productsByCategory.get(cat.id) ?? []}
                  />
                </div>
              ))}
            </div>

            {categories.length === 0 && filteredAllProducts.length > 0 && (
              <section className="container-pad section-pad">
                <h2 className="text-[var(--text-subheading)] font-semibold tracking-tight">
                  Products
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
                  {filteredAllProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} priority={i < 4} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer settings={safeSettings} brand={brand} />
      <WhatsAppButton phone={safeSettings.whatsapp} />
    </>
  );
}
