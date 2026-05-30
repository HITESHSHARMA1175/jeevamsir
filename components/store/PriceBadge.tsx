// ============================================
// FILE: components/store/PriceBadge.tsx
// PURPOSE: Display sell/MRP prices + discount badge
// USED IN: ProductCard, product page
// INTERN NOTE: Safe to adjust spacing/text sizes here.
// ============================================

import { Badge } from "@/components/ui/badge";
import {
  formatINR,
  getDiscountPercent,
  hasDiscount,
} from "@/utils/store/formatPrice";

type Props = {
  mrp: number;
  sell: number;
  size?: "sm" | "md" | "lg";
  showDiscountBadge?: boolean;
};

/**
 * PriceBadge
 * Renders formatted prices and a discount badge when applicable.
 */
export default function PriceBadge({
  mrp,
  sell,
  size = "md",
  showDiscountBadge = true,
}: Props) {
  const discounted = hasDiscount(mrp, sell);
  const percent = discounted ? getDiscountPercent(mrp, sell) : 0;

  const sellClass =
    size === "lg"
      ? "text-2xl"
      : size === "sm"
        ? "text-base"
        : "text-lg";

  const mrpClass =
    size === "lg"
      ? "text-base"
      : size === "sm"
        ? "text-xs"
        : "text-sm";

  return (
    <div className="flex items-center gap-2">
      <div className={`font-semibold ${sellClass}`}>{formatINR(sell)}</div>
      {discounted && (
        <>
          <div className={`text-muted-foreground line-through ${mrpClass}`}>
            {formatINR(mrp)}
          </div>
          {showDiscountBadge && (
            <Badge className="whitespace-nowrap rounded-sm bg-[var(--brand-accent)] px-2 py-0.5 text-[11px] font-semibold text-black hover:bg-[var(--brand-accent)]">
              {percent}% OFF
            </Badge>
          )}
        </>
      )}
    </div>
  );
}

PriceBadge.displayName = "PriceBadge";

