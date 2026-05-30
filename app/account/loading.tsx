// ============================================
// FILE: app/account/loading.tsx
// PURPOSE: Skeleton for account dashboard.
// ============================================

export default function Loading() {
  return (
    <main className="container-pad section-pad space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-slate-100" />
          ))}
        </div>
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </main>
  );
}
