"use client";

// ============================================
// FILE: components/store/CategoryProductsGrid.tsx
// PURPOSE: Category page grid with client-side stock filter
// USED IN: app/category/[slug]/page.tsx
// INTERN NOTE: Add sorting options here later.
// ============================================

import * as React from "react";
import type { Product } from "@/types";
import ProductCard from "@/components/store/ProductCard";
import StockFilter from "@/components/store/StockFilter";

type Props = {
  products: Product[];
  /** When set (subcategory filter active), empty state copy is more specific */
  subcategoryFilterName?: string | null;
};

/**
 * CategoryProductsGrid
 * Renders filter UI and a responsive products grid.
 */
export default function CategoryProductsGrid({
  products,
  subcategoryFilterName,
}: Props) {
  const [mode, setMode] = React.useState<"all" | "in_stock">("all");

  const filtered =
    mode === "in_stock" ? products.filter((p) => p.in_stock) : products;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          products
        </div>
        <StockFilter onChange={setMode} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <div className="text-base font-semibold">No Ayurveda products found</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {subcategoryFilterName
              ? `No products are tagged with “${subcategoryFilterName}” yet. Assign a subcategory to products in Admin → Products, or clear the filter below.`
              : "Try switching filters or add more Ayurveda products in Supabase."}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}

CategoryProductsGrid.displayName = "CategoryProductsGrid";

