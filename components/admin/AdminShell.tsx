"use client";

// ============================================
// FILE: components/admin/AdminShell.tsx
// PURPOSE: Layout shell for admin pages (sidebar + content)
// USED IN: app/admin/layout.tsx
// INTERN NOTE: Add new nav links here when adding new admin pages.
// ============================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ImageIcon,
  LayoutTemplate,
  LayoutDashboard,
  Package,
  PanelLeft,
  Percent,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminBrandName } from "@/components/admin/AdminBrandProvider";

type Props = {
  title: string;
  children: ReactNode;
};

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Percent },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/homepage", label: "Homepage", icon: LayoutTemplate },
  { href: "/admin/billing", label: "Billing", icon: Receipt },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/site", label: "Site", icon: Settings },
];

export default function AdminShell({ title, children }: Props) {
  const pathname = usePathname();
  const brandName = useAdminBrandName();
  const isNavActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname?.startsWith(href);

  return (
    <div className="admin-bg min-h-screen">
      <div className="container-pad py-4 sm:py-6">
        <header className="admin-panel mb-5 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-blue-100/80 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-slate-950 text-white shadow-lg shadow-blue-900/15 sm:h-11 sm:w-11">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="admin-section-title truncate">{brandName}</div>
                <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {title}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-blue-700 sm:block">
                Live Store Control
              </div>
              <Button asChild variant="outline" className="rounded-sm border-slate-200 bg-white">
                <Link href="/">Back to store</Link>
              </Button>
            </div>
          </div>
        </header>

        <nav className="admin-panel mb-5 grid grid-cols-2 gap-2 p-2 sm:grid-cols-4 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 items-center justify-center gap-2 rounded-sm border px-2 py-2.5 text-xs font-semibold transition-all",
                  active
                    ? "border-blue-200 bg-blue-600 text-white shadow-lg shadow-blue-600/15"
                    : "border-transparent bg-white text-slate-600 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:sticky lg:top-5 lg:block lg:self-start">
            <div className="admin-panel overflow-hidden">
              <div className="flex items-center gap-2 border-b border-blue-100/80 p-4">
                <PanelLeft className="h-4 w-4 text-blue-600" />
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Manage
                </div>
              </div>
              <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex min-w-max items-center gap-3 rounded-sm border px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:min-w-0",
                        active
                          ? "border-blue-200 bg-blue-600 text-white shadow-lg shadow-blue-600/15"
                          : "border-transparent text-slate-600 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {active && (
                        <motion.span
                          layoutId="admin-active-nav"
                          className="absolute inset-y-2 right-2 w-0.5 bg-white/80"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="min-w-0 space-y-5"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}

AdminShell.displayName = "AdminShell";

