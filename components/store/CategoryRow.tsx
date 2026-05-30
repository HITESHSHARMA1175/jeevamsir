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
    <section className="space-y-4 rounded-[0.9rem] border border-[#e7d8c4] bg-gradient-to-b from-[#fffdf9] to-[#f7efe4] p-3 shadow-[0_16px_40px_rgba(80,43,43,0.07)] backdrop-blur sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
            Spiritual collection
          </div>
          <h2 className="mt-1 text-[var(--text-subheading)] font-semibold tracking-tight text-slate-950">
            {category.icon_emoji ? `${category.icon_emoji} ` : ""}
            {category.name}
          </h2>
          <div className="mt-1 text-sm text-slate-500">
            Handpicked items in {category.name.toLowerCase()}
          </div>
        </div>
        <Link
          href={`/category/${category.slug}`}
          className="flex-shrink-0 rounded-sm border border-[#d8c0a0] bg-[#f3e7d8] px-3 py-1.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:border-[#c9a882] hover:bg-[#efdcc3] hover:text-[var(--brand-primary-hover)]"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:hidden">
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

