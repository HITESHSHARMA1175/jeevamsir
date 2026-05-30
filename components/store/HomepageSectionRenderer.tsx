import type { HomepageSection } from "@/types";
import type { ReactNode } from "react";
import ProductCard from "@/components/store/ProductCard";
import OfferTicker from "@/components/store/OfferTicker";
import BannerSection from "@/components/store/BannerSection";

type Props = {
  sections: HomepageSection[];
};

function ProductSection({ section }: { section: HomepageSection }) {
  const products = section.products ?? [];
  if (products.length === 0) return null;

  return (
    <section className="container-pad section-pad space-y-4">
      <div className="section-shell flex items-end justify-between gap-3">
        <div>
          <div className="ornate-kicker">
            Product spotlight
          </div>
          <h2 className="ornate-title">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>
    </section>
  );
}

function renderSection(section: HomepageSection) {
  if (section.section_type === "ticker") return <OfferTicker key={section.id} section={section} />;
  if (section.section_type === "banner") return <BannerSection key={section.id} section={section} />;
  return <ProductSection key={section.id} section={section} />;
}

export default function HomepageSectionRenderer({ sections }: Props) {
  if (sections.length === 0) return null;

  const autoBannerSections = sections.filter(
    (section) => section.section_type === "banner" && section.auto_banner_enabled,
  );
  const normalSections = sections.filter(
    (section) => !(section.section_type === "banner" && section.auto_banner_enabled),
  );
  const rendered: ReactNode[] = [];
  let eligibleCount = 0;

  normalSections.forEach((section) => {
    rendered.push(renderSection(section));
    if (section.section_type !== "banner") {
      eligibleCount += 1;
      autoBannerSections.forEach((bannerSection) => {
        if (eligibleCount % bannerSection.auto_insert_after_count === 0) {
          rendered.push(
            <BannerSection
              key={`${bannerSection.id}-${eligibleCount}`}
              section={bannerSection}
            />,
          );
        }
      });
    }
  });

  return <>{rendered}</>;
}

HomepageSectionRenderer.displayName = "HomepageSectionRenderer";

