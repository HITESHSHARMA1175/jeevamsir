"use client";

// ============================================
// FILE: components/store/WishlistHeart.tsx
// PURPOSE: Heart toggle that adds/removes a product from the
//          logged-in user's wishlist. Anonymous users are
//          redirected to /auth/login.
// USED IN: components/store/ProductCard.tsx,
//          app/products/[slug]/page.tsx
// PERF: Reads/writes go through StoreUserProvider so a 20-card
//       grid only triggers ONE auth fetch + ONE wishlist fetch
//       (instead of ~40 round-trips).
// ============================================

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useStoreUser } from "@/context/StoreUserProvider";

type Props = {
  productId: string;
  size?: "sm" | "md";
  variant?: "card" | "header";
  className?: string;
};

export default function WishlistHeart({
  productId,
  size = "md",
  variant = "header",
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInWishlist, toggleWishlist } = useStoreUser();
  const active = isInWishlist(productId);
  const [busy, setBusy] = React.useState(false);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    if (!user) {
      router.push(
        `/auth/login?next=${encodeURIComponent(pathname || "/")}`,
      );
      return;
    }
    setBusy(true);
    try {
      await toggleWishlist(productId);
    } finally {
      setBusy(false);
    }
  }

  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const baseClass =
    variant === "card"
      ? `absolute right-2 top-2 z-20 grid ${dim} place-items-center rounded-full bg-white/95 shadow-sm backdrop-blur transition-colors`
      : `inline-flex ${dim} items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={`${baseClass} ${
        active ? "text-rose-600" : "text-slate-500 hover:text-rose-600"
      } ${className ?? ""}`}
    >
      <Heart
        className={`${iconSize} transition-transform ${
          active ? "scale-110 fill-rose-600" : ""
        }`}
      />
    </button>
  );
}

WishlistHeart.displayName = "WishlistHeart";
