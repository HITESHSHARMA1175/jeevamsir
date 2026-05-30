"use client";

// ============================================
// FILE: app/error.tsx
// PURPOSE: Global error boundary UI (with retry)
// USED IN: Next.js error handling
// INTERN NOTE: If users see this, check Supabase env vars and DB rows.
// ============================================

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-16 text-center">
      <div className="space-y-4">
        <div className="text-2xl font-semibold">Something went wrong</div>
        <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">
          {error.message}
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Try Again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

