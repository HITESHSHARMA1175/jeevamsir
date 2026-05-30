"use client";

// ============================================
// FILE: context/StoreUserProvider.tsx
// PURPOSE: Single source of truth for the logged-in customer
//          on the storefront. Replaces the per-component
//          `supabase.auth.getUser()` calls that were happening
//          in HeaderAuth + every WishlistHeart on the page (one
//          fetch per ProductCard) and were causing the storefront
//          to feel hung on category / homepage.
//
//          Also owns the user's wishlist Set so WishlistHeart can
//          read/toggle synchronously instead of issuing one DB
//          query per card.
//
// USED IN: app/layout.tsx (root provider), HeaderAuth,
//          WishlistHeart, AccountDropdown.
// ============================================

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  email: string;
  fullName: string | null;
};

type Ctx = {
  ready: boolean;
  user: User | null;
  wishlistReady: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
};

const StoreUserCtx = React.createContext<Ctx | null>(null);

function readUser(raw: { id: string; email?: string | null; user_metadata?: unknown }): User | null {
  if (!raw?.email) return null;
  const meta = (raw.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    typeof meta.full_name === "string" ? (meta.full_name as string) : null;
  return { id: raw.id, email: raw.email, fullName };
}

export function StoreUserProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [wishlistReady, setWishlistReady] = React.useState(false);
  const [wishlist, setWishlist] = React.useState<Set<string>>(new Set());

  // Prevent double-fetching the wishlist for the same user.
  const wishlistLoadedFor = React.useRef<string | null>(null);

  const refreshWishlist = React.useCallback(async (uid: string | null) => {
    if (!uid) {
      setWishlist(new Set());
      setWishlistReady(true);
      wishlistLoadedFor.current = null;
      return;
    }
    if (wishlistLoadedFor.current === uid) return;
    wishlistLoadedFor.current = uid;
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", uid);
      const next = new Set<string>();
      ((data as unknown) as { product_id: string }[] | null)?.forEach((row) => {
        next.add(row.product_id);
      });
      setWishlist(next);
    } catch {
      // ignore — wishlist is best-effort.
    } finally {
      setWishlistReady(true);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const next = data.user ? readUser(data.user) : null;
      setUser(next);
      setReady(true);
      void refreshWishlist(next?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ? readUser(session.user) : null;
      setUser(next);
      setReady(true);
      void refreshWishlist(next?.id ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [refreshWishlist]);

  const isInWishlist = React.useCallback(
    (productId: string) => wishlist.has(productId),
    [wishlist],
  );

  const toggleWishlist = React.useCallback(
    async (productId: string): Promise<boolean> => {
      if (!user) return false;
      const supabase = createClient();
      const next = new Set(wishlist);
      const wasIn = next.has(productId);

      // Optimistic local update for snappy UX.
      if (wasIn) next.delete(productId);
      else next.add(productId);
      setWishlist(next);

      try {
        if (wasIn) {
          await supabase
            .from("wishlists")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId);
        } else {
          await supabase
            .from("wishlists")
            .insert({ user_id: user.id, product_id: productId });
        }
        return !wasIn;
      } catch {
        // Roll back on failure.
        const rollback = new Set(wishlist);
        setWishlist(rollback);
        return wasIn;
      }
    },
    [user, wishlist],
  );

  const value = React.useMemo<Ctx>(
    () => ({
      ready,
      user,
      wishlistReady,
      isInWishlist,
      toggleWishlist,
    }),
    [ready, user, wishlistReady, isInWishlist, toggleWishlist],
  );

  return (
    <StoreUserCtx.Provider value={value}>{children}</StoreUserCtx.Provider>
  );
}

export function useStoreUser(): Ctx {
  const ctx = React.useContext(StoreUserCtx);
  if (!ctx) {
    // Allow safe import outside the provider (e.g. admin pages).
    return {
      ready: true,
      user: null,
      wishlistReady: true,
      isInWishlist: () => false,
      toggleWishlist: async () => false,
    };
  }
  return ctx;
}
