// ============================================
// FILE: components/store/CategoryRow.tsx
// PURPOSE: Category heading + horizontal product row
// USED IN: Homepage
// INTERN NOTE: Adjust card widths for your design here.
// ============================================

import Link from "next/link";
import type { Category, Product } from "@/types";
import ProductCard from "./ProductCard";

type Props = { category: Category; products: Product[] };

/**
 * CategoryRow
 * Displays a category section and a horizontally scrollable list of ProductCards.
 */
export default function CategoryRow({ category, products }: Props) {
  if (!products || products.length === 0) return null;

  const mobileItems = products.slice(0, 6);

  return (
    <section className="space-y-3 rounded-sm border border-border bg-white p-3 shadow-[var(--shadow-soft)] sm:p-4 lg:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
          {category.icon_emoji ? `${category.icon_emoji} ` : ""}
          {category.name}
        </h2>
        <Link
          href={`/category/${category.slug}`}
          className="flex-shrink-0 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-primary/90 sm:px-4 sm:py-1.5 sm:text-xs"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {mobileItems.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div className="scroll-container pr-10 max-sm:hidden">
        {products.map((p) => (
          <div key={p.id} className="scroll-item min-w-[190px] sm:min-w-[220px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

CategoryRow.displayName = "CategoryRow";
