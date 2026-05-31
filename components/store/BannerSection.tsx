import Image from "next/image";
import Link from "next/link";
import type { Banner, HomepageSection } from "@/types";

type Props = {
  section: HomepageSection;
};

function BannerFrame({ banner }: { banner: Banner }) {
  const image = (
    <div className="relative aspect-[16/5] min-h-[170px] overflow-hidden rounded-[1.4rem] bg-muted shadow-[0_20px_50px_rgba(74,54,29,0.10)]">
      <Image
        src={banner.image_url}
        alt={banner.title ?? "Homepage banner"}
        fill
        unoptimized
        sizes="100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/18 to-transparent" />
      {(banner.title || banner.subtitle || banner.cta_text) && (
        <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center p-5 text-white sm:p-8">
          <div className="mb-3 inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
            Ayurveda collection
          </div>
          {banner.title && (
            <div className="text-xl font-semibold leading-tight sm:text-3xl">
              {banner.title}
            </div>
          )}
          {banner.subtitle && (
            <div className="mt-2 text-sm text-white/90 sm:text-base">{banner.subtitle}</div>
          )}
          {banner.cta_text && (
            <div className="mt-4 inline-flex w-fit rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              {banner.cta_text}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!banner.click_url || banner.target_type === "none") {
    return <div className="group block overflow-hidden rounded-[1.4rem] border border-amber-100 bg-card">{image}</div>;
  }

  return (
    <Link href={banner.click_url} className="group block overflow-hidden rounded-[1.4rem] border border-amber-100 bg-card">
      {image}
    </Link>
  );
}

export default function BannerSection({ section }: Props) {
  const banners = section.banners ?? [];
  if (banners.length === 0) return null;

  if (section.banner_layout === "grid" && banners.length > 1) {
    return (
      <section className="container-pad section-pad">
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <BannerFrame key={banner.id} banner={banner} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container-pad section-pad">
      <div className="space-y-4">
        {section.title && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
              Ayurveda spotlight
            </div>
            <h2 className="mt-1 text-[var(--text-subheading)] font-semibold tracking-tight">
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>
            )}
          </div>
        )}
        {banners.map((banner) => (
          <BannerFrame key={banner.id} banner={banner} />
        ))}
      </div>
    </section>
  );
}

BannerSection.displayName = "BannerSection";

