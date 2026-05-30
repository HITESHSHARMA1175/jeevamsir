"use client";

// ============================================
// FILE: components/store/CartSheet.tsx
// PURPOSE: Cart drawer content (items, totals, WhatsApp + Checkout)
// USED IN: components/store/CartButton
// INTERN NOTE: You can customize the empty-state text here.
// ============================================

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/utils/store/formatPrice";
import { buildCartOrderMessage, buildWhatsAppUrl } from "@/utils/store/whatsapp";

type Props = { phone: string };

/**
 * CartSheet
 * Renders cart contents inside a shadcn Sheet.
 */
export default function CartSheet({ phone }: Props) {
  const cart = useCart();

  const totalFormatted = formatINR(cart.totalPrice);

  if (cart.items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="text-4xl">🛍️</div>
        <div className="text-base font-semibold">Your bag is empty</div>
        <div className="text-sm text-muted-foreground">
          Add something you love, then come back to checkout.
        </div>
        <Button asChild className="mt-2">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const waMessage = buildCartOrderMessage(cart.items, totalFormatted);
  const waHref = buildWhatsAppUrl(phone, waMessage);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">Your Bag</div>
        <div className="text-sm text-muted-foreground">{cart.totalItems} items</div>
      </div>

      <Separator className="my-4" />

      <div className="flex-1 space-y-4 overflow-auto pr-2">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-2xl border bg-card p-3 shadow-soft">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  unoptimized
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-50 via-rose-50 to-amber-50 text-[10px] text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-sm font-medium">{item.name}</div>
              {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {Object.entries(item.selected_options)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" • ")}
                </div>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                {formatINR(item.sell_price)} each
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => cart.decrementItem(item.id)}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-8 text-center text-sm font-medium">{item.qty}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => cart.incrementItem(item.id)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <div className="ml-auto text-sm font-semibold">
                  {formatINR(item.sell_price * item.qty)}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={() => cart.removeItem(item.id)}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Subtotal</div>
          <div className="text-base font-semibold">{totalFormatted}</div>
        </div>

        <Button asChild className="w-full">
          <Link href="/checkout">Pay with Razorpay</Link>
        </Button>

        <Button
          type="button"
          className="w-full bg-whatsapp text-white hover:opacity-95"
          onClick={() => window.open(waHref, "_blank", "noreferrer")}
        >
          Order on WhatsApp
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => cart.clearCart()}
        >
          Clear cart
        </Button>
      </div>
    </div>
  );
}

CartSheet.displayName = "CartSheet";

