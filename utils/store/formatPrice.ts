// ============================================
// FILE: utils/store/formatPrice.ts
// PURPOSE: Price formatting + discount helpers
// USED IN: components/store/PriceBadge, cart + product pages
// INTERN NOTE: Safe to reuse these helpers across the project.
// ============================================

/**
 * formatINR
 * Formats a number as Indian Rupee with ₹ symbol.
 * Uses en-IN locale, no decimals.
 *
 * @example
 * formatINR(1500) // "₹1,500"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * getDiscountPercent
 * Calculates discount % from MRP and sell price.
 * Returns 0 if no discount.
 *
 * @example
 * getDiscountPercent(1000, 750) // 25
 */
export function getDiscountPercent(mrp: number, sell: number): number {
  if (mrp <= 0) return 0;
  if (sell >= mrp) return 0;
  return Math.round(((mrp - sell) / mrp) * 100);
}

/**
 * getSavingsAmount
 * Returns formatted rupee amount saved.
 *
 * @example
 * getSavingsAmount(1000, 750) // "₹250"
 */
export function getSavingsAmount(mrp: number, sell: number): string {
  const savings = Math.max(0, mrp - sell);
  return formatINR(savings);
}

/**
 * hasDiscount
 * Returns true if sell < mrp.
 */
export function hasDiscount(mrp: number, sell: number): boolean {
  return getDiscountPercent(mrp, sell) > 0;
}

