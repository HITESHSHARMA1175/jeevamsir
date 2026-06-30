// ============================================
// FILE: components/store/Footer.tsx
// PURPOSE: Store footer with brand identity, social, and quick links
// USED IN: app/page.tsx, product/category/account pages
// INTERN NOTE: Edit social URLs in /admin/site (Footer social links).
// ============================================

import Link from "next/link";
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";
import type { BrandSettings, SiteSettings, Category } from "@/types";
import { getCategories } from "@/utils/store/queries";
import Image from "next/image";

type Props = { settings: SiteSettings; brand?: BrandSettings | null };

type SocialLink = {
  href: string;
  label: string;
  Icon: typeof Instagram;
  className: string;
};

function buildSocials(brand?: BrandSettings | null): SocialLink[] {
  const links: SocialLink[] = [];
  if (brand?.instagram) {
    links.push({
      href: brand.instagram,
      label: "Instagram",
      Icon: Instagram,
      className: "bg-primary text-primary-foreground",
    });
  }
  if (brand?.facebook) {
    links.push({
      href: brand.facebook,
      label: "Facebook",
      Icon: Facebook,
      className: "bg-primary text-primary-foreground",
    });
  }
  if (brand?.youtube) {
    links.push({
      href: brand.youtube,
      label: "YouTube",
      Icon: Youtube,
      className: "bg-primary text-primary-foreground",
    });
  }
  return links;
}

export default async function Footer({ settings, brand }: Props) {
  const copyright =
    settings.footer_copyright?.trim() ||
    `© ${new Date().getFullYear()} ${settings.site_name}. All rights reserved.`;

  const socials = buildSocials(brand);
  const phoneDigits = settings.whatsapp?.replace(/\D/g, "") ?? "";
  const waHref = phoneDigits
    ? `https://wa.me/${phoneDigits}`
    : "#";
  const brandTagline = brand?.tagline?.trim() ?? "";
  const hasLegacyRudrakshaCopy = /rudraksha|gemstone|gemstones|malas|spiritual essentials|guidance/i.test(
    brandTagline,
  );
  const tagline = hasLegacyRudrakshaCopy
    ? "Pure Ayurveda-inspired care for everyday balance."
    : brandTagline || "Pure Ayurveda-inspired care for everyday balance.";

  // Fetch categories for Shop section
  const categories = await getCategories();
  const logoMark = /placehold\.co/i.test(settings.logo_url ?? "") ? (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-white text-primary shadow-sm sm:h-11 sm:w-11">
      <span className="text-lg font-semibold leading-none">S</span>
    </div>
  ) : settings.logo_url ? (
    <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-white shadow-sm sm:h-11 sm:w-11">
      <Image
        src={settings.logo_url}
        alt={settings.site_name}
        fill
        unoptimized
        sizes="44px"
        className="object-contain object-center p-1"
      />
    </span>
  ) : (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-white text-primary shadow-sm sm:h-11 sm:w-11">
      <span className="text-lg font-semibold leading-none">S</span>
    </div>
  );

  return (
    <footer className="mt-10 border-t border-border bg-muted sm:mt-16">
      <div className="container-pad py-6 sm:py-10">
        <div className="grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-4 lg:gap-10">
          {/* Brand — full width on mobile */}
          <div className="col-span-2 space-y-2.5 lg:col-span-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              {logoMark}
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
                  {settings.site_name || "ShopKart"}
                </div>
              </div>
            </div>
            <p className="max-w-xs text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-relaxed">{tagline}</p>
            {socials.length > 0 && (
              <div className="flex items-center gap-2">
                {socials.map(({ href, label, Icon, className }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Open our ${label}`}
                    className={`grid h-8 w-8 place-items-center rounded-full transition-transform duration-200 ease-out hover:-translate-y-0.5 sm:h-9 sm:w-9 ${className}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          <div className="space-y-2 sm:space-y-3">
            <div className="text-xs font-semibold text-foreground sm:text-sm">Shop</div>
            <ul className="space-y-2 text-sm sm:space-y-2.5">
              <li>
                <Link href="/" className="text-muted-foreground transition-colors duration-150 ease-out hover:text-primary" prefetch>
                  Home
                </Link>
              </li>
              {categories && categories.length > 0 ? (
                categories.slice(0, 6).map((cat: Category) => (
                  <li key={cat.id}>
                    <Link href={`/category/${cat.slug}`} className="text-muted-foreground transition-colors duration-150 ease-out hover:text-primary" prefetch>
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/category/sarees" className="text-muted-foreground transition-colors duration-150 ease-out hover:text-primary" prefetch>
                    All Products
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 sm:space-y-3">
            <div className="text-xs font-semibold text-foreground sm:text-sm">Quick Links</div>
            <ul className="space-y-2 text-sm sm:space-y-2.5">
              <li>
                <a href={waHref} target="_blank" rel="noreferrer noopener" className="text-muted-foreground transition-colors duration-150 ease-out hover:text-primary">
                  Track Orders
                </a>
              </li>
              <li>
                <Link href="/account/wishlist" className="text-muted-foreground transition-colors duration-150 ease-out hover:text-primary" prefetch>
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-muted-foreground transition-colors duration-150 ease-out hover:text-primary" prefetch>
                  Checkout
                </Link>
              </li>
              <li>
                <a href={waHref} target="_blank" rel="noreferrer noopener" className="text-muted-foreground transition-colors duration-150 ease-out hover:text-primary">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-2 sm:space-y-3">
            <div className="text-xs font-semibold text-foreground sm:text-sm">Contact</div>
            <ul className="space-y-2 text-xs sm:space-y-2.5 sm:text-sm">
              {settings.business_email && (
                <li className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <a href={`mailto:${settings.business_email}`} className="truncate text-muted-foreground transition-colors duration-150 ease-out hover:text-primary">
                    {settings.business_email}
                  </a>
                </li>
              )}
              {settings.whatsapp && (
                <li className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <a href={waHref} target="_blank" rel="noreferrer noopener" className="text-muted-foreground transition-colors duration-150 ease-out hover:text-primary">
                    {settings.whatsapp}
                  </a>
                </li>
              )}
              {settings.business_address && (
                <li className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{settings.business_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-pad flex flex-col items-center justify-between gap-2 py-3 text-center text-[11px] text-muted-foreground sm:flex-row sm:text-left sm:text-xs">
          <div>{copyright}</div>
          <div className="flex items-center gap-3">
            <Link href="/account" className="hover:text-primary" prefetch>Privacy</Link>
            <Link href="/account" className="hover:text-primary" prefetch>Terms</Link>
            <Link href="/account/orders" className="hover:text-primary" prefetch>Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

Footer.displayName = "Footer";
