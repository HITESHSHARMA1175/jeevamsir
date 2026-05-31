import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@/types";

type Props = {
  banners: Banner[];
};

function MiddleBannerCard({ banner }: { banner: Banner }) {
  const content = (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-amber-100 bg-card shadow-[0_20px_50px_rgba(74,54,29,0.10)]">
      <div className="relative aspect-[16/6] min-h-[180px]">
        <Image
          src={banner.image_url}
          alt={banner.title ?? "Homepage banner"}
          fill
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
        {(banner.title || banner.subtitle || banner.cta_text) && (
          <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center p-5 text-white sm:p-8">
            <div className="mb-3 inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
              Ayurveda spotlight
            </div>
            {banner.title && <div className="text-xl font-semibold leading-tight sm:text-3xl">{banner.title}</div>}
            {banner.subtitle && <div className="mt-2 text-sm text-white/90 sm:text-base">{banner.subtitle}</div>}
            {banner.cta_text && (
              <div className="mt-4 inline-flex w-fit rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
                {banner.cta_text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!banner.click_url || banner.target_type === "none") {
    return content;
  }

  return (
    <Link href={banner.click_url} className="group block">
      {content}
    </Link>
  );
}

export default function MiddleBannerSection({ banners }: Props) {
  if (!banners.length) return null;

  return (
    <section className="container-pad section-pad">
      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
            Middle banner
          </div>
          <h2 className="mt-1 text-[var(--text-subheading)] font-semibold tracking-tight">
            Featured Ayurvedic highlights
          </h2>
        </div>
        <div className="space-y-4">
          {banners.map((banner) => (
            <MiddleBannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
}

MiddleBannerSection.displayName = "MiddleBannerSection";