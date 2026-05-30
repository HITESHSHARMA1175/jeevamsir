// ============================================
// FILE: components/store/ProductCard.tsx
// PURPOSE: Product listing card (image, name, price, CTA)
// USED IN: Homepage, category page, related products
// INTERN NOTE: Safe to adjust spacing/labels here.
// PERF: Outer is a `<div>` with a stretched `<Link>` covering
//       the image+text. WishlistHeart and AddToCartButton are
//       siblings (not nested inside the Link), which means we
//       no longer ship invalid HTML and clicks no longer have
//       to fight `e.preventDefault()` to cancel navigation.
// ============================================

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { hasDiscount, getDiscountPercent } from "@/utils/store/formatPrice";
import PriceBadge from "./PriceBadge";
import AddToCartButton from "./AddToCartButton";
import WishlistHeart from "./WishlistHeart";

type Props = {
  product: Product;
  showCategory?: boolean;
  priority?: boolean;
};

export default function ProductCard({
  product,
  showCategory = false,
  priority = false,
}: Props) {
  const discounted = hasDiscount(product.mrp_price, product.sell_price);
  const percent = discounted
    ? getDiscountPercent(product.mrp_price, product.sell_price)
    : 0;

  const href = `/products/${product.slug}`;

  return (
    <div className="group relative block h-full overflow-hidden rounded-sm border border-blue-100/70 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(37,99,235,0.14)]">
      {/* Stretched link covering image + text content. AddToCart
          and WishlistHeart sit on top with their own z-index. */}
      <Link
        href={href}
        prefetch={false}
        aria-label={product.name}
        className="absolute inset-0 z-10"
      />

      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-blue-50 via-rose-50 to-amber-50">
        {discounted && (
          <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-sm bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:px-2 sm:text-xs">
            {percent}% OFF
          </div>
        )}

        <WishlistHeart productId={product.id} variant="card" size="sm" />

        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            unoptimized
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 260px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-50 via-rose-50 to-amber-50 text-sm text-slate-400">
            No image
          </div>
        )}

        {!product.in_stock && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-background/80 text-sm font-semibold text-muted-foreground">
            OUT OF STOCK
          </div>
        )}
      </div>

      <div className="space-y-2 p-2.5 sm:p-3">
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-rose-500 opacity-70 transition-all group-hover:w-20" />
        {(product.brand?.name || product.brand_name) && (
          <div className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
            {product.brand?.name ?? product.brand_name}
          </div>
        )}
        <div className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug text-foreground/90 sm:text-sm">
          {product.name}
        </div>

        {showCategory && product.category?.name && (
          <div className="inline-flex rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {product.category.name}
          </div>
        )}

        <PriceBadge
          mrp={product.mrp_price}
          sell={product.sell_price}
          size="sm"
          showDiscountBadge={false}
        />

        {/* Sits above the stretched link so clicks don't navigate. */}
        <div className="relative z-20">
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}

ProductCard.displayName = "ProductCard";
