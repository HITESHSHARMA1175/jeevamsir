import Link from "next/link";
import type { Category } from "@/types";

type Props = {
  categories: Category[];
  promoImageUrl?: string | null;
  promoLink?: string | null;
};

function CategoryIcon({ category }: { category: Category }) {
  if (category.image_url) {
    return (
      <img
        src={category.image_url}
        alt={category.name}
        className="h-full w-full rounded-full object-cover"
        loading="lazy"
      />
    );
  }

  if (category.icon_emoji) {
    return (
      <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[#6f8f4a] to-[#4e6a32] text-lg shadow-inner">
        {category.icon_emoji}
      </div>
    );
  }

  const initial = category.name.trim().charAt(0).toUpperCase() || "G";
  return (
    <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[#6f8f4a] to-[#4e6a32] text-xs font-semibold text-white shadow-inner">
      {initial}
    </div>
  );
}

export default function CategoryStrip({ categories, promoImageUrl, promoLink }: Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="border-y border-[#e2d6bc] bg-gradient-to-r from-[#fbf7ef] via-[#f6f0e4] to-[#f0eadc]">
      <div className="container-pad py-1 sm:py-1.5">
        <div className="flex items-end justify-between gap-2 pt-0.5 sm:pt-1">
          <div>
            <div className="text-[7px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
              Browse Ayurveda categories
            </div>
            <h2 className="mt-0.5 text-[11px] font-semibold tracking-tight text-slate-950 sm:text-xs">
              Herbs, oils, powders, and daily rituals
            </h2>
          </div>
          <div className="hidden text-[9px] text-slate-500 sm:block">
            Carefully selected Ayurveda and wellness essentials
          </div>
        </div>

        <div className="flex gap-0.5 overflow-x-auto py-1.5 scrollbar-hide sm:gap-1 sm:py-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex w-20 flex-shrink-0 flex-col items-center gap-2 text-center sm:w-24"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full transition-all group-hover:-translate-y-0.5 sm:h-20 sm:w-20">
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <CategoryIcon category={cat} />
                </div>
              </div>
              <div className="line-clamp-2 text-center text-[10px] font-semibold leading-tight text-slate-800 transition-colors group-hover:text-[var(--brand-primary)] sm:text-xs">
                {cat.name}
              </div>
            </Link>
          ))}
        </div>

        {/* Promo banner removed per request */}
      </div>
    </section>
  );
}

CategoryStrip.displayName = "CategoryStrip";

