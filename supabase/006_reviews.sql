-- ============================================================
-- FILE: supabase/006_reviews.sql
-- PURPOSE: Product reviews with admin moderation.
--          Any logged-in customer can submit a review (forced
--          to status='pending'); only approved reviews are public.
--          Admins (public.is_admin()) can update/delete.
-- DEPENDS ON: setup.sql, admin_policies.sql
-- IDEMPOTENT: Safe to re-run any time.
-- ============================================================

-- ============================================================
-- 1) ENUM: review status
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'review_status') then
    create type public.review_status as enum ('pending', 'approved', 'rejected');
  end if;
end$$;

-- ============================================================
-- 2) TABLE: product_reviews
-- ============================================================
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_email text,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.product_reviews is
  'Customer-submitted reviews. status starts pending; admin must approve.';

create index if not exists product_reviews_product_id_idx
  on public.product_reviews(product_id);
create index if not exists product_reviews_status_idx
  on public.product_reviews(status);
create index if not exists product_reviews_user_id_idx
  on public.product_reviews(user_id);

drop trigger if exists product_reviews_updated_at on public.product_reviews;
create trigger product_reviews_updated_at
before update on public.product_reviews
for each row execute function public.set_updated_at();

-- ============================================================
-- 3) TRIGGER: force new rows to status='pending'
--    (prevents customers from inserting status='approved' directly)
-- ============================================================
create or replace function public.force_review_pending()
returns trigger
language plpgsql
as $$
begin
  if not coalesce(public.is_admin(), false) then
    new.status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists product_reviews_force_pending on public.product_reviews;
create trigger product_reviews_force_pending
before insert on public.product_reviews
for each row execute function public.force_review_pending();

-- ============================================================
-- 4) AGGREGATE VIEW: avg rating + count per product (approved only)
-- ============================================================
create or replace view public.product_review_stats as
select
  product_id,
  count(*)::int as review_count,
  round(avg(rating)::numeric, 2) as avg_rating
from public.product_reviews
where status = 'approved'
group by product_id;

comment on view public.product_review_stats is
  'Public-readable aggregate of approved reviews per product.';

-- ============================================================
-- 5) RLS
-- ============================================================
alter table public.product_reviews enable row level security;

drop policy if exists public_read_approved on public.product_reviews;
create policy public_read_approved on public.product_reviews
for select using (status = 'approved');

drop policy if exists own_read on public.product_reviews;
create policy own_read on public.product_reviews
for select using (auth.uid() = user_id);

drop policy if exists admin_read on public.product_reviews;
create policy admin_read on public.product_reviews
for select using (public.is_admin());

drop policy if exists auth_insert on public.product_reviews;
create policy auth_insert on public.product_reviews
for insert with check (auth.role() = 'authenticated');

drop policy if exists admin_update on public.product_reviews;
create policy admin_update on public.product_reviews
for update using (public.is_admin())
with check (public.is_admin());

drop policy if exists admin_delete on public.product_reviews;
create policy admin_delete on public.product_reviews
for delete using (public.is_admin());

-- ✅ Section complete.
