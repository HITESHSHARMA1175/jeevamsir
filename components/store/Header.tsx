// ============================================
// FILE: components/store/Header.tsx
// PURPOSE: Sticky store header with logo, nav, and cart
// USED IN: app/page.tsx, product/category pages
// INTERN NOTE: You can edit navigation labels/links here.
// ============================================

import Image from "next/image";
import Link from "next/link";
import type { Category, SiteSettings, Subcategory } from "@/types";
import CartButton from "./CartButton";
import HeaderAuth from "@/components/store/HeaderAuth";
import CategoriesMenu from "@/components/store/CategoriesMenu";
import SearchBox from "@/components/store/SearchBox";

type Props = {
  settings: SiteSettings;
  categories: Category[];
  subcategories?: Subcategory[];
  query?: string;
};

/**
 * Header
 * Server component header (client cart button is a small island).
 */
export default function Header({ settings, categories, subcategories, query }: Props) {
    const logoMark = /placehold\.co/i.test(settings.logo_url ?? "") ? (
  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d9e6cf] bg-white text-[var(--brand-primary)] shadow-sm sm:h-11 sm:w-11">
      <span className="text-lg font-semibold leading-none">S</span>
    </div>
  ) : settings.logo_url ? (
    <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#d9e6cf] bg-white shadow-sm sm:h-11 sm:w-11">
      <Image
        src={settings.logo_url}
        alt={settings.site_name}
        fill
        unoptimized
        sizes="44px"
        className="object-contain object-center p-1"
        priority
      />
    </span>
  ) : (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d9e6cf] bg-white text-[var(--brand-primary)] shadow-sm sm:h-11 sm:w-11">
      <span className="text-lg font-semibold leading-none">S</span>
    </div>
  );

  const logo = (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      {logoMark}
      <div className="hidden sm:block leading-tight">
        <div className="text-sm font-semibold tracking-tight text-slate-950 sm:text-base whitespace-nowrap">
          {settings.site_name || "ShopKart"}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--brand-primary)]">
          Ayurveda care, naturally chosen
        </div>
      </div>
    </div>
  );

  return (
      <header className="sticky top-0 z-40 border-b border-[#e3d8be] bg-white/96 text-slate-950 shadow-[0_12px_28px_rgba(109,85,50,0.08)] backdrop-blur-xl">
      <div className="hidden border-b border-[#e3d8be] bg-[#f8f1e3] text-[10px] text-slate-600 lg:block">
          <div className="container-pad flex min-h-8 items-center justify-between gap-4 py-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
            <span>Pure herbal wellness every day</span>
            <span>Authentic Ayurveda essentials</span>
            <span>Trusted delivery across India</span>
          </div>
          <div className="font-medium text-[var(--brand-primary)]">
            {settings.whatsapp ? `WhatsApp: ${settings.whatsapp}` : settings.site_name}
          </div>
        </div>
      </div>
      <div className="container-pad">
        <div className="flex min-h-13 items-center gap-2 py-1 sm:min-h-14 sm:gap-2.5 lg:min-h-16 lg:gap-4">
          <Link
            href="/"
            className="flex min-w-0 flex-shrink-0 items-center rounded-full px-1 py-1"
            aria-label={`${settings.site_name} home`}
          >
            {logo}
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <SearchBox defaultValue={query} />
          </div>

          <nav className="hidden items-center gap-1 text-sm font-medium lg:flex lg:flex-shrink-0">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-slate-700 transition-colors hover:bg-[#edf2e2] hover:text-[var(--brand-primary)]"
            >
              Home
            </Link>
            <CategoriesMenu categories={categories} subcategories={subcategories} />
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <HeaderAuth />
            <CartButton phone={settings.whatsapp} />
            <div className="lg:hidden">
              <CategoriesMenu categories={categories} subcategories={subcategories} mobileOnly />
            </div>
          </div>
        </div>

          <div className="border-t border-[#e3d8be] pb-3 pt-2 lg:hidden">
          <SearchBox defaultValue={query} />
        </div>
      </div>
    </header>
  );
}

Header.displayName = "Header";

