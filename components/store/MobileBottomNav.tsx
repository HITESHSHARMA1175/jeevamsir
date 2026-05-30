"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";

function isHiddenPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin-forbidden")
  );
}

function NavItem({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] ${
        active ? "text-[var(--brand-primary)]" : "text-muted-foreground"
      }`}
    >
      {children}
      <span className="leading-none">{label}</span>
    </Link>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname() ?? "/";
  const cart = useCart();

  if (isHiddenPath(pathname)) return null;

  const isHome = pathname === "/";
  const isAccount = pathname.startsWith("/account");

  return (
    <>
      <div
        className="md:hidden"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
        aria-hidden
      />

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-3">
          <NavItem href="/" active={isHome} label="Home">
            <Home className="h-5 w-5" />
          </NavItem>

          <NavItem href="/checkout" active={pathname.startsWith("/checkout")} label="Cart">
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cart.totalItems > 0 && (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-primary)] px-1 text-[10px] font-semibold text-white">
                  {cart.totalItems}
                </span>
              )}
            </div>
          </NavItem>

          <NavItem href="/account" active={isAccount} label="Account">
            <User className="h-5 w-5" />
          </NavItem>
        </div>
      </nav>
    </>
  );
}

MobileBottomNav.displayName = "MobileBottomNav";

