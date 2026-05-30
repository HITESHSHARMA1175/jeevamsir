// ============================================
// FILE: utils/admin/serverAuth.ts
// PURPOSE: Server-only admin guards for /admin routes
// USED IN: app/admin/* server components/layout
// INTERN NOTE: Admin access is controlled by Supabase user app_metadata.role.
// ============================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Claims = {
  app_metadata?: { role?: string };
  user_metadata?: Record<string, unknown>;
  sub?: string;
  email?: string;
};

/**
 * requireAdminClaims
 * Redirects to login if unauthenticated, or throws if not admin.
 */
export async function requireAdminClaims(): Promise<Claims> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/admin/login");

  const claims = data.claims as unknown as Claims;
  const role = claims.app_metadata?.role;
  if (role !== "admin") {
    redirect("/admin-forbidden");
  }

  return claims;
}

