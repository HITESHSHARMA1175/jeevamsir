// ============================================
// FILE: app/admin/categories/page.tsx
// PURPOSE: Admin - CRUD categories
// USED IN: /admin/categories
// INTERN NOTE: Keep slugs lowercase with dashes only.
// ============================================

import AdminShell from "@/components/admin/AdminShell";
import CategoriesAdmin from "@/components/admin/CategoriesAdmin";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <AdminShell title="Categories">
      <CategoriesAdmin initial={(data as unknown as Category[]) ?? []} />
    </AdminShell>
  );
}

