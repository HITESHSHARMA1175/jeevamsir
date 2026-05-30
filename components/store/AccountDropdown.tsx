"use client";

// ============================================
// FILE: components/store/AccountDropdown.tsx
// PURPOSE: Logged-in customer dropdown with quick links.
// USED IN: components/store/HeaderAuth.tsx
// ============================================

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  email: string;
  fullName?: string | null;
};

function initialsOf(name: string | null | undefined, email: string) {
  const trimmed = (name ?? "").trim();
  if (trimmed) {
    return trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s.charAt(0).toUpperCase())
      .join("");
  }
  return (email.charAt(0) || "?").toUpperCase();
}

export default function AccountDropdown({ email, fullName }: Props) {
  const router = useRouter();
  const initials = initialsOf(fullName, email);
  const display = (fullName?.trim() || email.split("@")[0]) ?? "Account";

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Account menu"
          className="h-10 gap-2 rounded-sm px-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950 sm:pr-3"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-primary)] text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="hidden flex-col items-start leading-tight md:flex">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              Hello,
            </span>
            <span className="max-w-[120px] truncate text-sm font-semibold">
              {display}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-1.5rem)] max-w-xs border-blue-100 bg-white sm:w-60"
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-slate-950">{display}</span>
          <span className="text-xs font-normal text-slate-500">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <User className="h-4 w-4" /> My Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders" className="cursor-pointer">
            <Package className="h-4 w-4" /> My Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/reviews" className="cursor-pointer">
            <Star className="h-4 w-4" /> My Reviews
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/wishlist" className="cursor-pointer">
            <Heart className="h-4 w-4" /> Wishlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/addresses" className="cursor-pointer">
            <MapPin className="h-4 w-4" /> Addresses
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
            window.dispatchEvent(new Event("tp:open-cart"));
          }}
        >
          <ShoppingBag className="h-4 w-4" /> View cart
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700"
          onSelect={(e) => {
            e.preventDefault();
            void logout();
          }}
        >
          <LogOut className="h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

AccountDropdown.displayName = "AccountDropdown";
