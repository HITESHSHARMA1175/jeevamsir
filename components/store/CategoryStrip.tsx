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
      <div className="grid h-full w-full place-items-center rounded-full bg-primary text-lg shadow-inner">
        {category.icon_emoji}
      </div>
    );
  }

  const initial = category.name.trim().charAt(0).toUpperCase() || "G";
  return (
    <div className="grid h-full w-full place-items-center rounded-full bg-primary text-xs font-semibold text-white shadow-inner">
      {initial}
    </div>
  );
}

export default function CategoryStrip({ categories, promoImageUrl, promoLink }: Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="border-y border-border bg-white">
      <div className="container-pad py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">
            Shop by Category
          </h2>
          <div className="hidden text-xs text-muted-foreground sm:block">
            Carefully selected wellness essentials
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide sm:gap-5 sm:justify-center">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex w-[64px] flex-shrink-0 flex-col items-center gap-1.5 text-center sm:w-[80px]"
            >
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 border-transparent transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-sm sm:h-[60px] sm:w-[60px]">
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <CategoryIcon category={cat} />
                </div>
              </div>
              <div className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-foreground/80 transition-colors duration-150 ease-out group-hover:text-primary sm:text-[11px]">
                {cat.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

CategoryStrip.displayName = "CategoryStrip";

