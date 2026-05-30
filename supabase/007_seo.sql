-- ============================================================
-- FILE: supabase/007_seo.sql
-- PURPOSE: Full SEO management:
--   * Extend `site_settings` with verification + tracking + JSON-LD
--     business identity fields used as defaults across the site.
--   * New `seo_pages` table for per-path overrides
--     (title/description/keywords/OG/canonical/robots/JSON-LD).
--   * New `seo_keywords` table for the SEO team's keyword research.
-- DEPENDS ON: setup.sql, admin_policies.sql
-- IDEMPOTENT: Safe to re-run any time.
-- ============================================================

-- ============================================================
-- 1) SITE_SETTINGS: extend with SEO fields
-- ============================================================
alter table public.site_settings
  add column if not exists meta_keywords text[] not null default '{}'::text[],
  add column if not exists default_og_title text,
  add column if not exists default_og_desc text,
  add column if not exists robots_index_default boolean not null default true,
  add column if not exists gtm_id text,
  add column if not exists gsc_verification text,
  add column if not exists bing_verification text,
  add column if not exists schema_org_type text not null default 'Organization',
  add column if not exists business_name text,
  add column if not exists business_address text,
  add column if not exists business_phone text,
  add column if not exists business_email text;

comment on column public.site_settings.robots_index_default is
  'When false, robots.txt sends Disallow: / so the whole site is hidden from crawlers (use pre-launch).';
comment on column public.site_settings.gtm_id is
  'Google Tag Manager container id, e.g. GTM-XXXXXX. Renders in <head> when set.';
comment on column public.site_settings.gsc_verification is
  'Google Search Console verification token (the value attribute of the meta tag).';

-- ============================================================
-- 2) TABLE: seo_pages — per-path overrides
-- ============================================================
create table if not exists public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  title text,
  description text,
  keywords text[] not null default '{}'::text[],
  og_title text,
  og_desc text,
  og_image text,
  canonical_url text,
  robots_index boolean,
  json_ld jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.seo_pages is
  'Per-page SEO overrides keyed by URL path (e.g. "/", "/category/sarees", "/products/banarasi-silk-saree-red").';
comment on column public.seo_pages.json_ld is
  'Optional structured data; merged on top of any auto-generated JSON-LD on the page.';

create index if not exists seo_pages_path_idx on public.seo_pages(path);

drop trigger if exists seo_pages_updated_at on public.seo_pages;
create trigger seo_pages_updated_at
before update on public.seo_pages
for each row execute function public.set_updated_at();

-- ============================================================
-- 3) TABLE: seo_keywords — keyword research notes
-- ============================================================
create table if not exists public.seo_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  search_volume integer,
  difficulty smallint check (difficulty between 0 and 100),
  target_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.seo_keywords is
  'SEO team keyword research. target_path optionally points to a page in seo_pages.';

create index if not exists seo_keywords_keyword_idx on public.seo_keywords(keyword);
create index if not exists seo_keywords_target_path_idx on public.seo_keywords(target_path);

drop trigger if exists seo_keywords_updated_at on public.seo_keywords;
create trigger seo_keywords_updated_at
before update on public.seo_keywords
for each row execute function public.set_updated_at();

-- ============================================================
-- 4) RLS
-- ============================================================
alter table public.seo_pages enable row level security;
alter table public.seo_keywords enable row level security;

-- Public can read seo_pages so the storefront can fetch overrides anonymously.
drop policy if exists public_read on public.seo_pages;
create policy public_read on public.seo_pages
for select using (true);

drop policy if exists admin_write on public.seo_pages;
create policy admin_write on public.seo_pages
for all using (public.is_admin())
with check (public.is_admin());

-- seo_keywords are admin-only (research notes, not customer-facing).
drop policy if exists admin_read on public.seo_keywords;
create policy admin_read on public.seo_keywords
for select using (public.is_admin());

drop policy if exists admin_write on public.seo_keywords;
create policy admin_write on public.seo_keywords
for all using (public.is_admin())
with check (public.is_admin());

-- ✅ Section complete.
