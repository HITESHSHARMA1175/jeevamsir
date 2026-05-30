"use client";

import Image from "next/image";
import Link from "next/link";
import type { Category, Subcategory } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronRight, Home, Menu, User } from "lucide-react";

type Props = {
  categories: Category[];
  subcategories?: Subcategory[];
  mobileOnly?: boolean;
};

function CategoryIcon({ category }: { category: Category }) {
  if (category.image_url) {
    return (
      <span className="relative block h-5 w-5 shrink-0 overflow-hidden rounded-full bg-slate-100">
        <Image
          src={category.image_url}
          alt={category.name}
          fill
          unoptimized
          sizes="20px"
          className="object-cover"
        />
      </span>
    );
  }

  const initial = category.name.trim().charAt(0).toUpperCase() || "G";
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--brand-primary)] text-[10px] font-semibold text-white">
      {initial}
    </span>
  );
}

export default function CategoriesMenu({
  categories,
  subcategories,
  mobileOnly = false,
}: Props) {
  if (!categories || categories.length === 0) {
    return (
      <Link href="/" className="text-slate-700 hover:text-slate-950">
        Categories
      </Link>
    );
  }

  const byCategory = new Map<string, Subcategory[]>();
  (subcategories ?? []).forEach((s) => {
    const list = byCategory.get(s.category_id) ?? [];
    list.push(s);
    byCategory.set(s.category_id, list);
  });

  if (mobileOnly) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-sm border-slate-200 bg-white text-slate-950"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[92vw] overflow-y-auto p-0 sm:max-w-sm">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="grid gap-4 p-5">
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="justify-start rounded-sm">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start rounded-sm">
                <Link href="/account">
                  <User className="mr-2 h-4 w-4" />
                  Account
                </Link>
              </Button>
            </div>

            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Shop Categories
              </div>
              <div className="grid gap-3">
                {categories.map((category) => {
                  const subs = byCategory.get(category.id) ?? [];

                  return (
                    <div key={category.id} className="rounded-sm border bg-white">
                      <Link
                        href={`/category/${category.slug}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-950"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <CategoryIcon category={category} />
                          <span className="truncate">{category.name}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                      {subs.length > 0 && (
                        <div className="grid gap-1 border-t bg-slate-50 px-4 py-3">
                          {subs.slice(0, 6).map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/category/${category.slug}?sub=${sub.slug}`}
                              className="py-1.5 text-sm text-slate-600 hover:text-blue-700"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="rounded-sm px-3 py-2 text-slate-700 hover:bg-white/80 hover:text-blue-700"
        aria-label="Open categories"
      >
        Categories
      </button>
      <div className="invisible absolute right-0 top-full z-50 hidden w-[min(820px,calc(100vw-2rem))] translate-y-3 border bg-white text-slate-900 opacity-0 shadow-[0_24px_70px_rgba(15,23,42,0.18)] transition-all group-hover:visible group-hover:translate-y-2 group-hover:opacity-100 lg:block">
        <div className="grid min-h-[320px] grid-cols-[240px_minmax(0,1fr)]">
          <div className="border-r bg-slate-50 p-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="flex items-center gap-3 border-b border-slate-100 px-3 py-3 text-sm font-medium hover:bg-white hover:text-blue-700"
              >
                <CategoryIcon category={category} />
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5 p-5">
            {categories.map((category) => {
              const subs = byCategory.get(category.id) ?? [];
              return (
                <div key={category.id} className="space-y-2">
                  <Link href={`/category/${category.slug}`} className="text-sm font-semibold text-slate-950 hover:text-blue-700">
                    {category.name}
                  </Link>
                  <div className="grid gap-1">
                    {subs.slice(0, 8).map((sub) => (
                      <Link key={sub.id} href={`/category/${category.slug}?sub=${sub.slug}`} className="text-sm text-slate-500 hover:text-blue-700">
                        {sub.name}
                      </Link>
                    ))}
                    {subs.length === 0 && <span className="text-xs text-slate-400">All products</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

CategoriesMenu.displayName = "CategoriesMenu";

