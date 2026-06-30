import Image from "next/image";
import Link from "next/link";
import type { Banner, HomepageSection } from "@/types";

type Props = {
  section: HomepageSection;
};

function BannerFrame({ banner }: { banner: Banner }) {
  const image = (
    <div className="relative aspect-[16/8] min-h-[130px] overflow-hidden rounded-sm bg-muted shadow-[var(--shadow-soft)] sm:aspect-[16/5] sm:min-h-[170px]">
      <Image
        src={banner.image_url}
        alt={banner.title ?? "Homepage banner"}
        fill
        unoptimized
        sizes="100vw"
        className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
      />
      {/* Desktop overlay */}
      {(banner.title || banner.subtitle || banner.cta_text) && (
        <div className="absolute inset-y-0 left-0 hidden max-w-xl flex-col justify-center p-5 sm:flex lg:p-8">
          <div className="rounded-sm bg-white/85 p-4 backdrop-blur-sm">
            {banner.title && (
              <div className="text-xl font-semibold leading-tight text-foreground lg:text-3xl">
                {banner.title}
              </div>
            )}
            {banner.subtitle && (
              <div className="mt-1.5 text-sm text-muted-foreground lg:text-base">{banner.subtitle}</div>
            )}
            {banner.cta_text && (
              <div className="mt-3 inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-primary/90">
                {banner.cta_text}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Mobile bottom bar */}
      {(banner.title || banner.cta_text) && (
        <div className="absolute inset-x-0 bottom-0 bg-white/90 px-3 py-2.5 backdrop-blur-sm sm:hidden">
          {banner.title && <div className="text-xs font-semibold text-foreground line-clamp-1">{banner.title}</div>}
          {banner.subtitle && <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{banner.subtitle}</div>}
          {banner.cta_text && (
            <div className="mt-1.5 inline-flex rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white">
              {banner.cta_text}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!banner.click_url || banner.target_type === "none") {
    return <div className="group block overflow-hidden rounded-sm border border-border bg-white">{image}</div>;
  }

  return (
    <Link href={banner.click_url} className="group block overflow-hidden rounded-sm border border-border bg-white">
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
    <section className="container-pad py-3 sm:py-4">
      <div className="space-y-3">
        {banners.map((banner) => (
          <BannerFrame key={banner.id} banner={banner} />
        ))}
      </div>
    </section>
  );
}

BannerSection.displayName = "BannerSection";
