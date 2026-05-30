-- ============================================================
-- FILE: supabase/008_billing.sql
-- PURPOSE: GST-ready billing:
--   * Extend `site_settings` with business GSTIN, invoice prefix,
--     default tax rate, and invoice terms.
--   * Add billing fields on `orders` for B2B GSTIN capture.
--   * New `invoices` table with auto-generated invoice number
--     and a cached PDF URL.
-- DEPENDS ON: setup.sql, admin_policies.sql
-- IDEMPOTENT: Safe to re-run any time.
-- ============================================================

-- ============================================================
-- 1) SITE_SETTINGS: business identity for invoices
-- ============================================================
alter table public.site_settings
  add column if not exists gstin text,
  add column if not exists invoice_prefix text not null default 'INV-',
  add column if not exists invoice_terms text,
  add column if not exists tax_rate_default numeric(5,2) not null default 0
    check (tax_rate_default >= 0 and tax_rate_default <= 100);

comment on column public.site_settings.tax_rate_default is
  'Default tax rate as a percentage (e.g. 18 = 18% GST). Used when an order has no per-order rate.';

-- ============================================================
-- 2) ORDERS: capture optional billing GSTIN + billing address
-- ============================================================
alter table public.orders
  add column if not exists gstin text,
  add column if not exists billing_name text,
  add column if not exists billing_address text,
  add column if not exists tax_rate numeric(5,2),
  add column if not exists tax_amount numeric(10,2);

comment on column public.orders.tax_rate is
  'Tax rate snapshot at the time of order. NULL means use site_settings.tax_rate_default.';

-- ============================================================
-- 3) INVOICE NUMBER SEQUENCE
-- ============================================================
create sequence if not exists public.invoice_number_seq start 1001;

-- ============================================================
-- 4) TABLE: invoices
-- ============================================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  invoice_number text not null unique,
  issued_at timestamptz not null default now(),
  subtotal numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  currency text not null default 'INR',
  gstin text,
  billing_name text,
  billing_address text,
  billing_phone text,
  billing_email text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.invoices is
  'One invoice per order. invoice_number is generated from invoice_prefix + invoice_number_seq.';

create index if not exists invoices_issued_at_idx on public.invoices(issued_at desc);
create index if not exists invoices_billing_email_idx on public.invoices(billing_email);

drop trigger if exists invoices_updated_at on public.invoices;
create trigger invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

-- Trigger: auto-fill invoice_number from prefix + sequence if blank.
create or replace function public.assign_invoice_number()
returns trigger
language plpgsql
as $$
declare
  v_prefix text;
begin
  if new.invoice_number is null or length(trim(new.invoice_number)) = 0 then
    select coalesce(invoice_prefix, 'INV-')
      into v_prefix
      from public.site_settings
      limit 1;
    new.invoice_number := coalesce(v_prefix, 'INV-')
      || lpad(nextval('public.invoice_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_assign_number on public.invoices;
create trigger invoices_assign_number
before insert on public.invoices
for each row execute function public.assign_invoice_number();

-- ============================================================
-- 5) RLS
-- ============================================================
alter table public.invoices enable row level security;

-- Customer reads their own invoice (matched via order's email/user_id).
drop policy if exists customer_read_own on public.invoices;
create policy customer_read_own on public.invoices
for select using (
  exists (
    select 1
    from public.orders o
    where o.id = invoices.order_id
      and (
        (o.customer_email is not null and o.customer_email = (auth.jwt() ->> 'email'))
        or (o.user_id is not null and o.user_id = auth.uid())
      )
  )
);

drop policy if exists admin_read on public.invoices;
create policy admin_read on public.invoices
for select using (public.is_admin());

drop policy if exists admin_write on public.invoices;
create policy admin_write on public.invoices
for all using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- 6) STORAGE BUCKET: invoices (private, signed URLs only)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

drop policy if exists "Admin manage invoices" on storage.objects;
create policy "Admin manage invoices"
on storage.objects for all
using (bucket_id = 'invoices' and public.is_admin())
with check (bucket_id = 'invoices' and public.is_admin());

-- ✅ Section complete.
