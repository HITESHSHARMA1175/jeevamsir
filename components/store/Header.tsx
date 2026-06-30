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
  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-white text-[var(--brand-primary)] sm:h-11 sm:w-11">
      <span className="text-lg font-semibold leading-none">S</span>
    </div>
  ) : settings.logo_url ? (
    <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-white sm:h-11 sm:w-11">
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
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-white text-[var(--brand-primary)] sm:h-11 sm:w-11">
      <span className="text-lg font-semibold leading-none">S</span>
    </div>
  );

  const logo = (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      {logoMark}
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight text-slate-950 whitespace-nowrap">
          {settings.site_name || "ShopKart"}
        </div>
        <div className="hidden text-[11px] tracking-wide text-muted-foreground sm:block">
          Ayurveda care, naturally chosen
        </div>
      </div>
    </div>
  );

  return (
      <header className="sticky top-0 z-40 border-b border-border bg-white text-slate-950 backdrop-blur-sm">
      <div className="hidden border-b border-border bg-muted text-xs text-muted-foreground lg:block">
          <div className="container-pad flex min-h-9 items-center justify-between gap-6 py-1.5">
          <div className="flex flex-1 items-center justify-center gap-x-8 font-medium tracking-wide">
            <span>Pure herbal wellness every day</span>
            <span className="text-border">•</span>
            <span>Authentic Ayurveda essentials</span>
            <span className="text-border">•</span>
            <span>Trusted delivery across India</span>
          </div>
          <div className="flex-shrink-0 font-semibold text-primary">
            {settings.whatsapp ? `WhatsApp: ${settings.whatsapp}` : settings.site_name}
          </div>
        </div>
      </div>
      <div className="container-pad">
        <div className="flex min-h-[56px] items-center gap-2 py-1 sm:gap-2.5 lg:min-h-[64px] lg:gap-4">
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
              className="px-4 py-2 font-medium text-foreground/80 transition-colors duration-150 ease-out hover:text-primary"
            >
              Home
            </Link>
            <CategoriesMenu categories={categories} subcategories={subcategories} />
            <a
              href={`https://wa.me/${(settings.whatsapp ?? "").replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer noopener"
              className="px-4 py-2 font-medium text-foreground/80 transition-colors duration-150 ease-out hover:text-primary"
            >
              Support
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <CartButton phone={settings.whatsapp} />
            <div className="lg:hidden">
              <CategoriesMenu categories={categories} subcategories={subcategories} mobileOnly />
            </div>
          </div>
        </div>

          <div className="border-t border-border pb-3 pt-2 lg:hidden">
          <SearchBox defaultValue={query} />
        </div>
      </div>
    </header>
  );
}

Header.displayName = "Header";

