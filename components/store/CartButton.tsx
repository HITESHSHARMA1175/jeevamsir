"use client";

// ============================================
// FILE: components/store/CartButton.tsx
// PURPOSE: Cart icon trigger + Sheet wrapper
// USED IN: components/store/Header
// INTERN NOTE: Safe to change icon/badge style here.
// ============================================

import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import CartSheet from "./CartSheet";

type Props = { phone: string };

/**
 * CartButton
 * Trigger that opens cart drawer.
 */
export default function CartButton({ phone }: Props) {
  const cart = useCart();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("tp:open-cart", onOpen);
    return () => window.removeEventListener("tp:open-cart", onOpen);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-sm text-slate-800 hover:bg-slate-100 hover:text-slate-950"
        >
          <ShoppingBag className="h-5 w-5" />
          {cart.totalItems > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full bg-[var(--brand-primary)] px-1 text-white hover:bg-[var(--brand-primary)]">
              {cart.totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[92vw] sm:max-w-md">
        <SheetHeader />
        <CartSheet phone={phone} />
      </SheetContent>
    </Sheet>
  );
}

CartButton.displayName = "CartButton";

