"use client";

import type { Blog } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

export default function BlogCarousel({ blogs }: { blogs: Blog[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!blogs || blogs.length === 0) {
    return null;
  }

  return (
    <section className="container-pad section-pad">
      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
            Knowledge Hub
          </div>
          <h2 className="mt-1 text-[var(--text-subheading)] font-semibold tracking-tight">
            Latest Blog Posts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover insights, tips & expert knowledge
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-2 lg:-translate-x-4 grid h-10 w-10 place-items-center rounded-full bg-white/80 hover:bg-white shadow-sm border border-border text-slate-900 hover:shadow-md transition-colors duration-150 ease-out"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-2 lg:translate-x-4 grid h-10 w-10 place-items-center rounded-full bg-white/80 hover:bg-white shadow-sm border border-border text-slate-900 hover:shadow-md transition-colors duration-150 ease-out"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Scrollable Content */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth px-8 py-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="flex-shrink-0 w-80 group"
              >
                <div className="h-full rounded-sm border border-border bg-white shadow-sm hover:shadow-lg transition-all duration-200 ease-out overflow-hidden">
                  {/* Image */}
                  {blog.image_url && (
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      <Image
                        src={blog.image_url}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-200 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Category Badge */}
                    <div className="inline-block rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-[var(--brand-primary)] mb-3">
                      {blog.category}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-slate-950 line-clamp-2 group-hover:text-[var(--brand-primary)] transition-colors duration-150 ease-out">
                      {blog.title}
                    </h3>

                    {/* Excerpt */}
                    {blog.excerpt && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {blog.excerpt}
                      </p>
                    )}

                    {/* Read More Link */}
                    <div className="mt-3 inline-flex items-center text-xs font-semibold text-[var(--brand-primary)] group-hover:gap-1 gap-0.5 transition-all duration-200 ease-out">
                      Read Article
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150 ease-out">›</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
