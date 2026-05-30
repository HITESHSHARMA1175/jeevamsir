-- ============================================================
-- FILE: supabase/009_wishlist.sql
-- PURPOSE: Per-user wishlist (heart icon on product cards).
-- DEPENDS ON: setup.sql, admin_policies.sql
-- IDEMPOTENT: Safe to re-run any time.
-- ============================================================

create table if not exists public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

comment on table public.wishlists is
  'Per-customer favorites; user_id matches auth.uid(). Anonymous users keep their wishlist client-side.';

create index if not exists wishlists_user_id_idx on public.wishlists(user_id);
create index if not exists wishlists_product_id_idx on public.wishlists(product_id);

-- ============================================================
-- RLS — user reads/writes only their own rows.
-- ============================================================
alter table public.wishlists enable row level security;

drop policy if exists own_read on public.wishlists;
create policy own_read on public.wishlists
for select using (auth.uid() = user_id);

drop policy if exists own_insert on public.wishlists;
create policy own_insert on public.wishlists
for insert with check (auth.uid() = user_id);

drop policy if exists own_delete on public.wishlists;
create policy own_delete on public.wishlists
for delete using (auth.uid() = user_id);

drop policy if exists admin_read on public.wishlists;
create policy admin_read on public.wishlists
for select using (public.is_admin());

-- ✅ Section complete.
