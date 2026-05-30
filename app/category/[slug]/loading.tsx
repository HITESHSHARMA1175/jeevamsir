// ============================================
// FILE: app/category/[slug]/loading.tsx
// PURPOSE: Skeleton for category listing.
// ============================================

export default function Loading() {
  return (
    <main className="container-pad section-pad">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
        <div className="hidden h-[420px] animate-pulse rounded-sm bg-slate-100 lg:block" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square animate-pulse rounded-sm bg-slate-100" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
