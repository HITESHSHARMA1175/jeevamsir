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
    <div className="group relative block h-full overflow-hidden rounded-sm border border-border bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
      {/* Stretched link covering image + text content. AddToCart
          and WishlistHeart sit on top with their own z-index. */}
      <Link
        href={href}
        prefetch={false}
        aria-label={product.name}
        className="absolute inset-0 z-10"
      />

      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {discounted && (
          <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
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
            className="rounded-[2px] object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-sm text-muted-foreground">
            No image
          </div>
        )}

        {!product.in_stock && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-background/80 text-sm font-semibold text-muted-foreground">
            OUT OF STOCK
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-3 sm:p-3.5">
        {(product.brand?.name || product.brand_name) && (
          <div className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand?.name ?? product.brand_name}
          </div>
        )}
        <div className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-foreground sm:text-sm">
          {product.name}
        </div>

        {showCategory && product.category?.name && (
          <div className="inline-flex rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {product.category.name}
          </div>
        )}

        <div className={discounted ? "text-primary" : ""}>
          <PriceBadge
            mrp={product.mrp_price}
            sell={product.sell_price}
            size="sm"
            showDiscountBadge={false}
          />
        </div>

        {/* Sits above the stretched link so clicks don't navigate. */}
        <div className="relative z-20">
          <AddToCartButton product={product} className="rounded-full" />
        </div>
      </div>
    </div>
  );
}

ProductCard.displayName = "ProductCard";
