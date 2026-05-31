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
  MessageCircle,
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
      className:
      "bg-gradient-to-br from-[#6f8f4a] via-[#8a7244] to-[#c98f2c] text-white",
    });
  }
  if (brand?.facebook) {
    links.push({
      href: brand.facebook,
      label: "Facebook",
      Icon: Facebook,
      className: "bg-[#6b7f4d] text-white",
    });
  }
  if (brand?.youtube) {
    links.push({
      href: brand.youtube,
      label: "YouTube",
      Icon: Youtube,
      className: "bg-[#8c5f3d] text-white",
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
      />
    </span>
  ) : (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d9e6cf] bg-white text-[var(--brand-primary)] shadow-sm sm:h-11 sm:w-11">
      <span className="text-lg font-semibold leading-none">S</span>
    </div>
  );

  return (
    <footer className="mt-16 border-t border-[#d8c8a5] bg-gradient-to-br from-[#48612f] via-[#6b7f4d] to-[#8a7244] text-[#fcf7eb]">
      <div className="container-pad py-10 sm:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {logoMark}
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight text-white sm:text-base whitespace-nowrap">
                  {settings.site_name || "ShopKart"}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#f0e6cf]">
                  Ayurveda-inspired care, made simple
                </div>
              </div>
            </div>
            <p className="text-sm leading-6 text-[#f7efdf]">{tagline}</p>
            {socials.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                {socials.map(({ href, label, Icon, className }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Open our ${label}`}
                    className={`grid h-10 w-10 place-items-center rounded-full shadow-md transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0e6cf]">
              Shop
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-[#f7efdf] transition-colors hover:text-white"
                  prefetch
                >
                  Home
                </Link>
              </li>
              {categories && categories.length > 0 ? (
                categories.slice(0, 5).map((cat: Category) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-[#f7efdf] transition-colors hover:text-white"
                      prefetch
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link
                      href="/category/sarees"
                      className="text-[#f7efdf] transition-colors hover:text-white"
                      prefetch
                    >
                      Sarees
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/kurtis"
                      className="text-[#f7efdf] transition-colors hover:text-white"
                      prefetch
                    >
                      Kurtis
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0e6cf]">
              Support
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                  <Link
                    href="/account/orders"
                    className="text-[#f7efdf] transition-colors hover:text-white"
                    prefetch
                  >
                  Track order
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  className="text-[#f7efdf] transition-colors hover:text-white"
                  prefetch
                >
                  My account
                </Link>
              </li>
              <li>
                <Link
                  href="/account/wishlist"
                  className="text-[#f7efdf] transition-colors hover:text-white"
                  prefetch
                >
                  Wishlist
                </Link>
              </li>
              <li>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-[#f7efdf] transition-colors hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 text-[#ffcc00]" />
                  WhatsApp us
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0e6cf]">
              Connect
            </div>
            <ul className="space-y-3 text-sm">
              {settings.business_email && (
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ffcc00]" />
                  <a
                    href={`mailto:${settings.business_email}`}
                    className="break-all text-[#f7efdf] transition-colors hover:text-white"
                  >
                    {settings.business_email}
                  </a>
                </li>
              )}
              {settings.business_phone && (
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ffcc00]" />
                  <a
                    href={`tel:${settings.business_phone}`}
                    className="text-[#f7efdf] transition-colors hover:text-white"
                  >
                    {settings.business_phone}
                  </a>
                </li>
              )}
              {settings.whatsapp && (
                <li className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ffcc00]" />
                  <span className="text-[#f7efdf]">
                    WhatsApp:{" "}
                    <span className="font-medium text-white">
                      {settings.whatsapp}
                    </span>
                  </span>
                </li>
              )}
              {settings.business_address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ffcc00]" />
                  <span className="text-[#f7efdf]">
                    {settings.business_address}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#2a2418]/30">
        <div className="container-pad flex flex-col items-center justify-between gap-3 py-5 text-center text-xs text-[#f0e6cf] sm:flex-row sm:text-left">
          <div className="break-words">{copyright}</div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/account"
              className="transition-colors hover:text-white"
              prefetch
            >
              Privacy
            </Link>
            <Link
              href="/account"
              className="transition-colors hover:text-white"
              prefetch
            >
              Terms
            </Link>
            <Link
              href="/account/orders"
              className="transition-colors hover:text-white"
              prefetch
            >
              Returns
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

Footer.displayName = "Footer";
