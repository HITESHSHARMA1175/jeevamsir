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
      <div
        className="h-full w-full rounded-full bg-center bg-cover"
        style={{ backgroundImage: `url(${category.image_url})` }}
      />
    );
  }

  if (category.icon_emoji) {
    return (
      <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[#2874f0] to-[#1f5ec9] text-2xl shadow-inner">
        {category.icon_emoji}
      </div>
    );
  }

  const initial = category.name.trim().charAt(0).toUpperCase() || "G";
  return (
    <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[#2874f0] to-[#1f5ec9] text-sm font-semibold text-white shadow-inner">
      {initial}
    </div>
  );
}

export default function CategoryStrip({ categories, promoImageUrl, promoLink }: Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="border-y border-blue-100 bg-gradient-to-r from-[#eef5ff] via-[#f7faff] to-[#edf4ff]">
      <div className="container-pad py-1.5 sm:py-2">
        <div className="flex items-end justify-between gap-3 pt-1 sm:pt-1.5">
          <div>
            <div className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              Shop by category
            </div>
            <h2 className="mt-0.5 text-xs font-semibold tracking-tight text-slate-950 sm:text-sm">
              Discover the collection
            </h2>
          </div>
          <div className="hidden text-[10px] text-slate-500 sm:block">
            Curated for spiritual, gemstone, and daily wear essentials
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-hide sm:gap-2 sm:py-2.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex w-24 flex-shrink-0 flex-col items-center gap-2 text-center sm:w-28"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full transition-all group-hover:-translate-y-1 sm:h-24 sm:w-24">
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <CategoryIcon category={cat} />
                </div>
              </div>
              <div className="line-clamp-2 text-center text-xs font-semibold leading-tight text-slate-800 transition-colors group-hover:text-[var(--brand-primary)] sm:text-sm">
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

