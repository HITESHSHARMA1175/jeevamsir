// ============================================
// FILE: app/admin/billing/page.tsx
// PURPOSE: Admin billing — KPIs, invoice list, settings.
// USED IN: /admin/billing
// ============================================

import AdminShell from "@/components/admin/AdminShell";
import BillingAdmin from "@/components/admin/BillingAdmin";
import { createClient } from "@/lib/supabase/server";
import type { Invoice, Order, SiteSettings } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminBilling() {
  const supabase = await createClient();
  const [{ data: invoiceRows }, { data: orderRows }, { data: settings }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .order("issued_at", { ascending: false })
        .limit(500),
      supabase
        .from("orders")
        .select(
          "id, customer_name, customer_email, total_amount, payment_method, payment_status, status, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("site_settings").select("*").maybeSingle(),
    ]);

  const invoices = ((invoiceRows as unknown) as Invoice[]) ?? [];
  const orders = ((orderRows as unknown) as Order[]) ?? [];
  const settingsRow = (settings as unknown as SiteSettings) ?? null;

  return (
    <AdminShell title="Billing">
      <BillingAdmin
        invoices={invoices}
        orders={orders}
        settings={settingsRow}
      />
    </AdminShell>
  );
}
