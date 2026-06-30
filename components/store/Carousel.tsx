"use client";

// ============================================
// FILE: components/store/Carousel.tsx
// PURPOSE: Draggable + auto-advancing hero banners carousel
// USED IN: Homepage
// INTERN NOTE: Adjust auto-advance timing by editing the interval.
// ============================================

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { banners: Banner[] };

/**
 * Carousel
 * Horizontal drag carousel with dots and auto-advance.
 */
export default function Carousel({ banners }: Props) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const clampIndex = React.useCallback(
    (next: number) => {
      if (banners.length <= 0) return 0;
      return ((next % banners.length) + banners.length) % banners.length;
    },
    [banners.length],
  );

  React.useEffect(() => {
    if (banners.length <= 1) return;
    if (paused) return;

    const id = window.setInterval(() => {
      setIndex((prev) => clampIndex(prev + 1));
    }, 4000);
    return () => window.clearInterval(id);
  }, [banners.length, clampIndex, paused]);

  if (banners.length === 0) return null;

  const current = banners[Math.min(index, banners.length - 1)];

  return (
    <section
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="w-full px-1.5 pt-1.5 sm:px-2.5 sm:pt-2 lg:px-3">
        <div className="relative overflow-hidden rounded-sm border border-border bg-white shadow-[var(--shadow-soft)]">
          <div className="relative h-[45vw] min-h-[140px] max-h-[280px] w-full sm:h-[32vw] sm:min-h-[200px] sm:max-h-[300px] lg:max-h-[400px]">
            {current.click_url ? (
              <Link href={current.click_url} className="block h-full w-full">
                <Image
                  src={current.image_url}
                  alt={current.title ?? `Banner ${index + 1}`}
                  fill
                  priority
                  unoptimized
                  sizes="100vw"
                  className="object-cover"
                />
              </Link>
            ) : (
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={current.image_url}
                  alt={current.title ?? `Banner ${index + 1}`}
                  fill
                  priority
                  unoptimized
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            )}

          {(current.title || current.subtitle || (current.cta_text && current.click_url)) && (
            <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2.5 lg:p-5">
              <div className="hidden sm:block sm:space-y-1 sm:max-w-xl sm:rounded-sm sm:bg-white/80 sm:p-2.5 sm:text-foreground sm:backdrop-blur-sm lg:space-y-2 lg:p-4">
                <div className="hidden sm:inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-primary lg:px-2.5 lg:py-1 lg:text-[9px]">
                  Featured
                </div>
                {current.title && (
                  <div className="hidden sm:block text-xs sm:text-base lg:text-2xl font-semibold leading-tight">
                    {current.title}
                  </div>
                )}
                {current.subtitle && (
                  <div className="hidden sm:block line-clamp-1 text-[10px] lg:text-xs text-muted-foreground leading-snug">
                    {current.subtitle}
                  </div>
                )}
              </div>
              {current.cta_text && current.click_url && (
                <Button
                  asChild
                  className="mt-0 sm:mt-1 h-7 rounded-full bg-primary px-2.5 text-xs font-semibold text-white hover:bg-primary/90 active:scale-95 transition-colors duration-150 ease-out sm:h-8 lg:h-9"
                >
                  <Link href={current.click_url}>{current.cta_text}</Link>
                </Button>
              )}
            </div>
          )}

          {banners.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous banner"
                onClick={() => setIndex((i) => clampIndex(i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-white/80 p-1.5 text-foreground backdrop-blur-sm transition-colors duration-150 ease-out hover:bg-white active:scale-95 sm:left-3 sm:p-2"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                aria-label="Next banner"
                onClick={() => setIndex((i) => clampIndex(i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-white/80 p-1.5 text-foreground backdrop-blur-sm transition-colors duration-150 ease-out hover:bg-white active:scale-95 sm:right-3 sm:p-2"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </>
          )}
          </div>

          {banners.length > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1.5 backdrop-blur-sm sm:bottom-4 sm:right-4 sm:gap-2 sm:px-3 sm:py-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`rounded-full transition-all duration-200 ease-out ${
                    i === index ? "h-2.5 w-6 bg-primary shadow-sm sm:h-3 sm:w-8" : "h-2.5 w-2.5 bg-muted-foreground/40 hover:bg-muted-foreground/60 sm:h-3 sm:w-3"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

Carousel.displayName = "Carousel";
