"use client";

// ============================================
// FILE: components/store/AddToCartButton.tsx
// PURPOSE: Client island button to add an item to cart
// USED IN: ProductCard, product page
// INTERN NOTE: Safe to tweak button text here.
// ============================================

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

type Props = { product: Product; className?: string };

/**
 * AddToCartButton
 * Adds a product to cart and shows a brief "Added" state.
 */
export default function AddToCartButton({ product, className }: Props) {
  const cart = useCart();
  const [added, setAdded] = React.useState(false);

  const disabled = !product.in_stock;

  return (
    <Button
      type="button"
      variant="default"
      className={`w-full rounded-full bg-primary text-white transition-colors duration-150 ease-out hover:bg-primary/90 ${className ?? ""}`}
      disabled={disabled}
      onClick={(e) => {
        // If the button is inside a Link-wrapped card, prevent navigation.
        e.preventDefault();
        e.stopPropagation();
        cart.addItem(product);
        setAdded(true);
        window.dispatchEvent(new Event("tp:open-cart"));
        window.setTimeout(() => setAdded(false), 1000);
      }}
    >
      {disabled ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
    </Button>
  );
}

AddToCartButton.displayName = "AddToCartButton";
