"use client";

// ============================================
// FILE: components/store/ImageGallery.tsx
// PURPOSE: Product image gallery with thumbnail switching
// USED IN: app/products/[slug]/page.tsx
// INTERN NOTE: You can adjust thumbnail sizes here.
// ============================================

import * as React from "react";
import Image from "next/image";

type Props = {
  images: { url: string; alt: string }[];
  priority?: boolean;
};

/**
 * ImageGallery
 * Simple gallery where clicking a thumbnail changes the main image.
 */
export default function ImageGallery({ images, priority = false }: Props) {
  const safe = images.filter((i) => !!i.url);
  const [active, setActive] = React.useState(0);

  if (safe.length === 0) return null;

  const hasThumbs = safe.length > 1;
  const current = safe[Math.min(active, safe.length - 1)];

  return (
    <div
      className={
        hasThumbs ? "grid gap-3 md:grid-cols-[88px_1fr] md:gap-4" : "grid gap-3"
      }
    >
      {hasThumbs && (
        <div className="order-2 md:order-1">
          <div className="scroll-container md:flex-col md:gap-3 md:overflow-y-auto md:overflow-x-hidden md:pr-1">
            {safe.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={`scroll-item relative h-16 w-16 overflow-hidden rounded-xl border md:h-20 md:w-20 ${
                  i === active ? "border-foreground" : "border-border"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="order-1 md:order-2">
        <div className="relative aspect-square w-full overflow-hidden bg-transparent lg:h-[640px] lg:aspect-auto">
          <Image
            src={current.url}
            alt={current.alt}
            fill
            unoptimized
            priority={priority}
            sizes="(max-width: 768px) 92vw, (max-width: 1024px) 55vw, 760px"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}

ImageGallery.displayName = "ImageGallery";

