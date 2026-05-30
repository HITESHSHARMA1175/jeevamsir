// ============================================
// FILE: app/admin/layout.tsx
// PURPOSE: Admin area layout + admin access guard
// USED IN: All /admin routes
// INTERN NOTE: Admin requires app_metadata.role = "admin".
// ============================================

import { requireAdminClaims } from "@/utils/admin/serverAuth";
import { AdminBrandProvider } from "@/components/admin/AdminBrandProvider";
import { getSiteSettings } from "@/utils/store/queries";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminClaims();
  const settings = await getSiteSettings();
  const brandName = settings?.site_name?.trim() || "Admin Console";

  return <AdminBrandProvider brandName={brandName}>{children}</AdminBrandProvider>;
}

