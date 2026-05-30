// ============================================
// FILE: app/products/[slug]/loading.tsx
// PURPOSE: Skeleton loading UI for product page
// USED IN: Next.js route loading state
// INTERN NOTE: Tweak skeleton sizes to match your layout.
// ============================================

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-4 h-4 w-64 animate-pulse rounded bg-muted" />

      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />

        <div className="space-y-4">
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
          <div className="h-10 w-56 animate-pulse rounded bg-muted" />
          <div className="h-10 w-60 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </main>
  );
}

