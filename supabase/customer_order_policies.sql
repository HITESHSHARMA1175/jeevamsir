-- ============================================================
-- FILE: supabase/customer_order_policies.sql
-- PURPOSE: Customer Account order visibility (RLS)
-- ============================================================
-- This project stores customer orders with `customer_email`.
-- We want customers to be able to read ONLY their own orders/items
-- while admins (public.is_admin()) can read/update all orders.
--
-- Run this after `supabase/setup.sql`.

-- =========================
-- ORDERS: customer read own
-- =========================
drop policy if exists auth_read_orders on public.orders;
create policy auth_read_own_orders on public.orders
for select
using (
  auth.role() = 'authenticated'
  and customer_email is not null
  and customer_email = (auth.jwt() ->> 'email')
);

-- Customers should NOT be able to update orders.
drop policy if exists auth_update_orders on public.orders;

-- Keep public insert for checkout (already created in setup.sql).
-- keep: public_create_order

-- =========================
-- ORDER ITEMS: customer read own
-- =========================
drop policy if exists auth_read_order_items on public.order_items;
create policy auth_read_own_order_items on public.order_items
for select
using (
  auth.role() = 'authenticated'
  and exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.customer_email is not null
      and o.customer_email = (auth.jwt() ->> 'email')
  )
);

-- Customers should NOT be able to update order_items.
drop policy if exists auth_update_order_items on public.order_items;

-- Keep public insert for checkout (already created in setup.sql).
-- keep: public_create_order_item

-- ============================================================
-- Note: Admin policies remain defined in `supabase/admin_policies.sql`
-- ============================================================

