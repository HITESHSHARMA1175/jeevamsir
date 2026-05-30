-- ============================================================
-- FILE: supabase/010_tax_inclusive.sql
-- PURPOSE: Add a global toggle so the storefront can mark sell prices
--          as ALREADY INCLUDING GST. When ON (default), the invoice
--          API reverse-extracts the GST so the printed total matches
--          exactly what the customer paid at checkout.
-- DEPENDS ON: 008_billing.sql
-- IDEMPOTENT: Safe to re-run any time.
-- ============================================================

alter table public.site_settings
  add column if not exists prices_tax_inclusive boolean not null default true;

comment on column public.site_settings.prices_tax_inclusive is
  'When true, sell prices ALREADY include GST. The invoice reverse-extracts the base and tax. When false, GST is added on top of the sell price.';
