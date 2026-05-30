"use client";

// ============================================
// FILE: context/CartContext.tsx
// PURPOSE: Client-side cart state + persistence
// USED IN: app/layout.tsx, components/store/CartSheet, AddToCartButton
// INTERN NOTE: Cart is stored in localStorage (techpotli_cart).
// ============================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { CartAction, CartContextType, CartItem, CartState, Product } from "@/types";

// === STATE ===
const initialState: CartState = { items: [], totalItems: 0, totalPrice: 0 };

function calcTotals(items: CartItem[]): { totalItems: number; totalPrice: number } {
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.sell_price * item.qty, 0);
  return { totalItems, totalPrice };
}

// === REDUCER ===
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE": {
      const items = Array.isArray(action.payload) ? action.payload : [];
      const totals = calcTotals(items);
      return { items, ...totals };
    }
    case "ADD_ITEM": {
      const matchKey = (item: CartItem) =>
        item.id === action.payload.id &&
        JSON.stringify(item.selected_options ?? {}) ===
          JSON.stringify(action.payload.selected_options ?? {});
      const existing = state.items.find(matchKey);
      const items = existing
        ? state.items.map((i) =>
            matchKey(i) ? { ...i, qty: i.qty + 1 } : i,
          )
        : [...state.items, { ...action.payload, qty: 1 }];
      const totals = calcTotals(items);
      return { items, ...totals };
    }
    case "REMOVE_ITEM": {
      const items = state.items.filter((i) => i.id !== action.payload.id);
      const totals = calcTotals(items);
      return { items, ...totals };
    }
    case "INCREMENT": {
      const items = state.items.map((i) =>
        i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i,
      );
      const totals = calcTotals(items);
      return { items, ...totals };
    }
    case "DECREMENT": {
      const found = state.items.find((i) => i.id === action.payload.id);
      if (!found) return state;
      const items =
        found.qty <= 1
          ? state.items.filter((i) => i.id !== action.payload.id)
          : state.items.map((i) =>
              i.id === action.payload.id ? { ...i, qty: i.qty - 1 } : i,
            );
      const totals = calcTotals(items);
      return { items, ...totals };
    }
    case "CLEAR_CART": {
      return initialState;
    }
    default:
      return state;
  }
}

// === CONTEXT ===
const CartContext = createContext<CartContextType | null>(null);

// === PROVIDER ===

/**
 * CartProvider
 * Provides cart state + actions to the app.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("techpotli_cart");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      dispatch({ type: "HYDRATE", payload: parsed as CartItem[] });
    } catch {
      // ignore corrupt localStorage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("techpotli_cart", JSON.stringify(state.items));
    } catch {
      // ignore write errors (private mode/quota)
    }
  }, [state.items]);

  const addItem = useCallback(
    (product: Product, selectedOptions?: Record<string, string>) => {
      const payload: CartItem = {
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        sell_price: Number(product.sell_price),
        mrp_price: Number(product.mrp_price),
        qty: 1,
        slug: product.slug,
        selected_options:
          selectedOptions && Object.keys(selectedOptions).length > 0
            ? selectedOptions
            : undefined,
      };
      dispatch({ type: "ADD_ITEM", payload });
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  }, []);

  const incrementItem = useCallback((id: string) => {
    dispatch({ type: "INCREMENT", payload: { id } });
  }, []);

  const decrementItem = useCallback((id: string) => {
    dispatch({ type: "DECREMENT", payload: { id } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const isInCart = useCallback(
    (id: string) => state.items.some((i) => i.id === id),
    [state.items],
  );

  const getItemQty = useCallback(
    (id: string) => state.items.find((i) => i.id === id)?.qty ?? 0,
    [state.items],
  );

  const value = useMemo<CartContextType>(
    () => ({
      ...state,
      addItem,
      removeItem,
      incrementItem,
      decrementItem,
      clearCart,
      isInCart,
      getItemQty,
    }),
    [
      state,
      addItem,
      removeItem,
      incrementItem,
      decrementItem,
      clearCart,
      isInCart,
      getItemQty,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// === HOOK ===

/**
 * useCart
 * Access cart state + actions.
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

// ⚠️ INTERN: Wrap your root app/layout.tsx children with <CartProvider>
// Like this:
// export default function RootLayout({ children }) {
//   return (
//     <html>
//       <body>
//         <CartProvider>{children}</CartProvider>
//       </body>
//     </html>
//   )
// }

