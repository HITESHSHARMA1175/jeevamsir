// ============================================
// FILE: app/api/admin/seo/revalidate/route.ts
// PURPOSE: Force-refresh ISR caches for a path after the admin
//          updates a per-page SEO entry (or global defaults).
// SECURITY: Admin-only. Uses requireAdminClaims() guard.
// USED IN: components/admin/SEOAdmin.tsx
// ============================================

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminClaims } from "@/utils/admin/serverAuth";

export const dynamic = "force-dynamic";

type Body = { path?: string };

export async function POST(request: Request) {
  try {
    await requireAdminClaims();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const path = body.path?.trim();

  try {
    // Always refresh the layout so verification tokens / GTM / org JSON-LD
    // pick up immediately when global SEO settings change.
    revalidatePath("/", "layout");
    if (path && path.startsWith("/")) {
      revalidatePath(path);
    }
  } catch (error) {
    console.error("[seo/revalidate] error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, path: path ?? null });
}
