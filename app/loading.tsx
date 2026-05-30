// ============================================
// FILE: app/loading.tsx
// PURPOSE: Skeleton for the storefront home so navigation
//          paints instantly while the real page streams in.
// USED IN: Next.js App Router loading state for "/".
// ============================================

export default function Loading() {
  return (
    <div className="min-h-svh">
      {/* Header strip */}
      <div className="sticky top-0 z-40 border-b border-blue-100 bg-white/80 backdrop-blur">
        <div className="container-pad flex min-h-16 items-center gap-4 py-2">
          <div className="h-10 w-32 animate-pulse rounded-sm bg-slate-200" />
          <div className="hidden h-10 flex-1 animate-pulse rounded-sm bg-slate-100 lg:block" />
          <div className="ml-auto h-10 w-24 animate-pulse rounded-sm bg-slate-100" />
        </div>
      </div>

      {/* Carousel */}
      <div className="container-pad mt-4">
        <div className="aspect-[16/6] w-full animate-pulse rounded-sm bg-slate-200" />
      </div>

      {/* Category strip */}
      <div className="container-pad mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-sm bg-slate-100"
          />
        ))}
      </div>

      {/* Featured grid */}
      <div className="container-pad section-pad space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square animate-pulse rounded-sm bg-slate-100" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
