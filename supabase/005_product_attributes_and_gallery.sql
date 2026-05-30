-- ============================================================
-- FILE: supabase/005_product_attributes_and_gallery.sql
-- PURPOSE: Multi-image (max 6) gallery + flexible attribute groups
--          + selected_options on order_items + order accept/cancel
--          timestamps so admin can track fulfillment lifecycle.
-- DEPENDS ON: setup.sql, admin_policies.sql
-- IDEMPOTENT: Safe to re-run any time.
-- ============================================================

-- ============================================================
-- 1) PRODUCTS: cap gallery at 6 + add flexible `attributes`
-- ============================================================
-- Drop any older gallery checks so we can replace cleanly.
alter table public.products
  drop constraint if exists products_gallery_max_six;

alter table public.products
  add constraint products_gallery_max_six
  check (coalesce(array_length(image_gallery, 1), 0) <= 6);

alter table public.products
  add column if not exists attributes jsonb not null default '[]'::jsonb;

comment on column public.products.attributes is
  'Flexible attribute groups, e.g. [{"label":"Size","options":["S","M","L"]},{"label":"Type","options":["Nepali","Indian"]}]';

-- ============================================================
-- 2) ORDER_ITEMS: capture customer's chosen options at purchase
-- ============================================================
alter table public.order_items
  add column if not exists selected_options jsonb not null default '{}'::jsonb;

comment on column public.order_items.selected_options is
  'Map of {attribute_label: chosen_option}, e.g. {"Size":"M","Color":"Red"}';

-- ============================================================
-- 3) ORDERS: accept/cancel lifecycle timestamps
-- ============================================================
alter table public.orders
  add column if not exists accepted_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

create index if not exists orders_status_created_idx
  on public.orders(status, created_at desc);

-- ✅ Section complete.
