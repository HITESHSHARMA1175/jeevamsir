"use client";

// ============================================
// FILE: components/store/ProductOptionsPicker.tsx
// PURPOSE: Render a product's attribute groups as selectable
//          pills (Size, Color, Type, etc.) and require a pick
//          per group before Add to Cart.
// USED IN: app/products/[slug]/page.tsx
// ============================================

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import type { Product, ProductAttributeGroup } from "@/types";

type Props = {
  product: Product;
  attributes: ProductAttributeGroup[];
};

export default function ProductOptionsPicker({ product, attributes }: Props) {
  const cart = useCart();
  const [selected, setSelected] = React.useState<Record<string, string>>({});
  const [added, setAdded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const requiredLabels = attributes
    .filter((group) => group.options.length > 0 && group.label.trim().length > 0)
    .map((group) => group.label);

  const allSelected = requiredLabels.every((label) => Boolean(selected[label]));

  function pick(label: string, option: string) {
    setSelected((prev) => ({ ...prev, [label]: option }));
    setError(null);
  }

  function addToCart() {
    if (!product.in_stock) return;
    if (!allSelected) {
      setError(
        `Please choose ${requiredLabels
          .filter((label) => !selected[label])
          .join(", ")} before adding to cart.`,
      );
      return;
    }
    cart.addItem(product, selected);
    setAdded(true);
    window.dispatchEvent(new Event("tp:open-cart"));
    window.setTimeout(() => setAdded(false), 1000);
  }

  return (
    <div className="space-y-4">
      {attributes.map((group) =>
        group.label.trim().length === 0 || group.options.length === 0 ? null : (
          <div key={group.label} className="space-y-2">
            <div className="text-sm font-semibold text-foreground">
              {group.label}
              {selected[group.label] && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Selected: {selected[group.label]}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const active = selected[group.label] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => pick(group.label, option)}
                    className={`min-w-12 rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-150 ease-out ${
                      active
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border bg-white text-foreground hover:border-primary/50 hover:bg-accent/50"
                    }`}
                    aria-pressed={active}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ),
      )}

      {error && <div className="text-sm text-rose-600">{error}</div>}

      <Button
        type="button"
        variant="default"
        className="w-full rounded-full bg-primary text-white hover:bg-primary/90"
        disabled={!product.in_stock}
        onClick={addToCart}
      >
        {!product.in_stock
          ? "Out of Stock"
          : added
            ? "Added ✓"
            : "Add to Cart"}
      </Button>
    </div>
  );
}

ProductOptionsPicker.displayName = "ProductOptionsPicker";
