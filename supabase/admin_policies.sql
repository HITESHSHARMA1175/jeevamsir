-- ============================================================
-- FILE: supabase/admin_policies.sql
-- PURPOSE: Tighten RLS to admin-only writes + Storage policies
-- USED IN: Supabase SQL Editor (run after setup.sql)
-- INTERN NOTE: This enables /admin panel to safely manage data.
-- ============================================================

-- =========================
-- ADMIN CHECK (RLS helper)
-- =========================
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ============================================================
-- CATALOG TABLES: admin-only write
-- ============================================================
-- site_settings
drop policy if exists auth_write on public.site_settings;
drop policy if exists admin_write on public.site_settings;
create policy admin_write on public.site_settings
for all
using (public.is_admin())
with check (public.is_admin());

-- banners
drop policy if exists auth_write on public.banners;
create policy admin_write on public.banners
for all
using (public.is_admin())
with check (public.is_admin());

-- categories
drop policy if exists auth_write on public.categories;
drop policy if exists admin_write on public.categories;
create policy admin_write on public.categories
for all
using (public.is_admin())
with check (public.is_admin());

-- legacy subcategories table (kept for older projects)
drop policy if exists auth_write on public.subcategories;
drop policy if exists admin_write on public.subcategories;
create policy admin_write on public.subcategories
for all
using (public.is_admin())
with check (public.is_admin());

-- product brands
drop policy if exists auth_write on public.brands;
drop policy if exists admin_write on public.brands;
create policy admin_write on public.brands
for all
using (public.is_admin())
with check (public.is_admin());

-- products
drop policy if exists auth_write on public.products;
drop policy if exists admin_write on public.products;
create policy admin_write on public.products
for all
using (public.is_admin())
with check (public.is_admin());

-- homepage builder sections
drop policy if exists auth_write on public.homepage_sections;
drop policy if exists admin_write on public.homepage_sections;
create policy admin_write on public.homepage_sections
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists auth_write on public.homepage_section_products;
drop policy if exists admin_write on public.homepage_section_products;
create policy admin_write on public.homepage_section_products
for all
using (public.is_admin())
with check (public.is_admin());

-- coupons
drop policy if exists auth_write on public.coupons;
drop policy if exists admin_write on public.coupons;
create policy admin_write on public.coupons
for all
using (public.is_admin())
with check (public.is_admin());

-- brand_settings
drop policy if exists auth_write on public.brand_settings;
drop policy if exists admin_write on public.brand_settings;
create policy admin_write on public.brand_settings
for all
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- ORDERS: allow public insert, admin read/update
-- ============================================================
drop policy if exists auth_read_orders on public.orders;
create policy admin_read on public.orders
for select using (public.is_admin());

drop policy if exists auth_update_orders on public.orders;
create policy admin_update on public.orders
for update using (public.is_admin())
with check (public.is_admin());

drop policy if exists auth_read_order_items on public.order_items;
create policy admin_read on public.order_items
for select using (public.is_admin());

drop policy if exists auth_update_order_items on public.order_items;
create policy admin_update on public.order_items
for update using (public.is_admin())
with check (public.is_admin());

drop policy if exists auth_read_payment_attempts on public.payment_attempts;
drop policy if exists admin_read on public.payment_attempts;
create policy admin_read on public.payment_attempts
for select using (public.is_admin());

drop policy if exists auth_update_payment_attempts on public.payment_attempts;
drop policy if exists admin_update on public.payment_attempts;
create policy admin_update on public.payment_attempts
for update using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- STORAGE: public read, admin write (bucket: "public")
-- ============================================================
-- Create bucket (id=name) if it doesn't exist
insert into storage.buckets (id, name, public)
values ('public', 'public', true)
on conflict (id) do update set public = true;

-- Public read objects in bucket
drop policy if exists "Public read" on storage.objects;
create policy "Public read"
on storage.objects for select
using (bucket_id = 'public');

-- Admin write objects in bucket
drop policy if exists "Admin write" on storage.objects;
create policy "Admin write"
on storage.objects for all
using (bucket_id = 'public' and public.is_admin())
with check (bucket_id = 'public' and public.is_admin());

-- ✅ admin_policies.sql complete