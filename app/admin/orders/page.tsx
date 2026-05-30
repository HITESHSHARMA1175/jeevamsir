// ============================================
// FILE: app/admin/orders/page.tsx
// PURPOSE: Admin - view and update orders
// USED IN: /admin/orders
// INTERN NOTE: Orders are created by checkout flow.
// ============================================

import AdminShell from "@/components/admin/AdminShell";
import OrdersAdmin from "@/components/admin/OrdersAdmin";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const orders = (data as unknown as Order[]) ?? [];
  const orderIds = orders.map((order) => order.id);
  const { data: itemRows } = orderIds.length
    ? await supabase.from("order_items").select("*").in("order_id", orderIds)
    : { data: [] };

  return (
    <AdminShell title="Orders">
      <OrdersAdmin initial={orders} initialItems={(itemRows as unknown as OrderItem[]) ?? []} />
    </AdminShell>
  );
}

