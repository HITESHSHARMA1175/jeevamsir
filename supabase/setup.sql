-- ============================================================
-- FILE: supabase/setup.sql
-- PURPOSE: Techpotli E-Com Engine database schema + seed data
-- USED IN: Supabase SQL Editor (run once)
-- INTERN NOTE: You can re-run on a fresh Supabase project only.
-- ============================================================

-- ============================================================
-- SECTION 0: EXTENSIONS + HELPERS
-- ============================================================
create extension if not exists pgcrypto;

-- Auto-updated timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- SECTION 1: SITE SETTINGS (1 row only)
-- ============================================================
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  -- Brand
  site_name text not null default 'My Store',
  logo_url text,
  footer_copyright text,
  -- SEO
  meta_title text not null default 'My Store - Shop Online',
  meta_desc text not null default 'Shop the best products online',
  og_image text,
  -- Analytics
  ga_id text,
  -- Contact
  whatsapp text not null default '7705074250',
  -- Billing
  business_name text,
  business_email text,
  business_phone text,
  business_address text,
  gstin text,
  invoice_prefix text not null default 'INV-',
  tax_rate_default numeric(5,2) not null default 0,
  prices_tax_inclusive boolean not null default false,
  invoice_terms text,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
comment on table public.site_settings is
  'INTERN: Edit this via Supabase Table Editor. Only 1 row allowed.';

create trigger site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at(); 

-- Enforce "exactly one row" (soft-enforced by a unique constant)
alter table public.site_settings
  add column if not exists singleton_guard boolean not null default true;
create unique index if not exists site_settings_singleton on public.site_settings (singleton_guard);

-- ============================================================
-- SECTION 2: BANNERS
-- ============================================================
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text,
  subtitle text,
  cta_text text,
  click_url text,
  placement text not null default 'hero',
  section_id uuid,
  target_type text not null default 'custom_url',
  target_product_id uuid,
  target_category_id uuid,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  constraint banners_placement_check check (placement in ('hero', 'section', 'middle', 'campaign')),
  constraint banners_target_type_check check (target_type in ('none', 'custom_url', 'product', 'category'))
);

alter table public.banners
  add constraint banners_image_url_http check (image_url ~ '^https?://');

comment on table public.banners is
  'INTERN: Add rows here for new banner slides.';

-- ============================================================
-- SECTION 3: CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete cascade,
  name text not null unique,
  slug text not null unique,
  image_url text,
  icon_emoji text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint categories_no_self_parent check (parent_id is null or parent_id <> id),
  constraint categories_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create trigger categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- ============================================================
-- SECTION 3B: SUBCATEGORIES
-- ============================================================
create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  constraint subcategories_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint subcategories_unique_per_category unique (category_id, slug)
);

create index if not exists subcategories_category_id_idx on public.subcategories(category_id);

-- ============================================================
-- SECTION 4: PRODUCT BRANDS
-- ============================================================
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint brands_slug_format check (slug ~ '^[a-z0-9-]+$')
);
comment on table public.brands is
  'INTERN: Product brands/manufacturers managed from admin product upload.';

create trigger brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

-- ============================================================
-- SECTION 5: PRODUCTS
-- ============================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_name text,
  brand_id uuid references public.brands(id) on delete set null,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  description text,
  image_url text not null,
  image_gallery text[] not null default '{}'::text[],
  mrp_price numeric(10,2) not null,
  sell_price numeric(10,2) not null,
  in_stock boolean not null default true,
  is_featured boolean not null default false,
  tags text[] not null default '{}'::text[],
  meta_title text,
  meta_desc text,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint products_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint products_sell_le_mrp check (sell_price <= mrp_price)
);
comment on table public.products is
  'INTERN: Each row = 1 product. slug must be lowercase with dashes only.';

create trigger products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ============================================================
-- SECTION 6: HOMEPAGE BUILDER
-- ============================================================
create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  section_type text not null default 'products',
  product_source text not null default 'manual',
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  max_items integer not null default 8 check (max_items > 0),
  ticker_text text,
  ticker_speed integer not null default 30 check (ticker_speed > 0),
  banner_layout text not null default 'wide',
  background_color text,
  auto_banner_enabled boolean not null default false,
  auto_insert_after_count integer not null default 2 check (auto_insert_after_count > 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint homepage_sections_type_check check (section_type in ('products', 'ticker', 'banner')),
  constraint homepage_sections_product_source_check check (product_source in ('manual', 'featured', 'new_arrivals', 'category', 'brand')),
  constraint homepage_sections_banner_layout_check check (banner_layout in ('wide', 'grid', 'split'))
);

comment on table public.homepage_sections is
  'INTERN: Admin-managed homepage rows after hero carousel.';

create trigger homepage_sections_updated_at
before update on public.homepage_sections
for each row execute function public.set_updated_at();

create table if not exists public.homepage_section_products (
  section_id uuid not null references public.homepage_sections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  primary key (section_id, product_id)
);

-- ============================================================
-- SECTION 7: COUPONS
-- ============================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null,
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) not null default 0,
  max_discount_amount numeric(10,2),
  starts_at timestamptz default now(),
  expires_at timestamptz,
  usage_limit integer,
  per_customer_limit integer,
  used_count integer not null default 0,
  applies_to text not null default 'all',
  category_id uuid references public.categories(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint coupons_discount_type_check check (discount_type in ('percent', 'flat')),
  constraint coupons_applies_to_check check (applies_to in ('all', 'category', 'product', 'brand')),
  constraint coupons_discount_positive check (discount_value > 0)
);

create trigger coupons_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

-- ============================================================
-- SECTION 8: BRAND SETTINGS
-- ============================================================
create table if not exists public.brand_settings (
  id uuid primary key default gen_random_uuid(),
  owner_name text,
  tagline text,
  bio text,
  photo_url text,
  instagram text,
  youtube text,
  facebook text,
  created_at timestamptz default now()
);

-- ============================================================
-- SECTION 9: ORDERS (Razorpay + WhatsApp/COD support)
-- ============================================================
create type public.order_status as enum (
  'created',
  'paid',
  'failed',
  'packed',
  'shipped',
  'delivered',
  'cancelled'
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid,

  -- Customer
  customer_name text,
  customer_phone text,
  customer_email text,
  alternate_phone text,
  shipping_address text,
  address_line text,
  city text,
  state text,
  pincode text,
  landmark text,

  -- Totals (store computed totals to keep record stable)
  currency text not null default 'INR',
  subtotal_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  total_amount numeric(10,2) not null,

  status public.order_status not null default 'created',
  payment_method text not null default 'razorpay',
  payment_status text not null default 'pending',

  -- Payment (Razorpay)
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,

  -- Optional: WhatsApp follow-up
  whatsapp_phone text,
  constraint orders_payment_method_check check (payment_method in ('cod', 'razorpay', 'phonepe')),
  constraint orders_payment_status_check check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded'))
);

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  status text not null default 'pending',
  amount numeric(10,2) not null,
  currency text not null default 'INR',
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint payment_attempts_provider_check check (provider in ('cod', 'razorpay', 'phonepe')),
  constraint payment_attempts_status_check check (status in ('pending', 'paid', 'failed', 'refunded'))
);

create trigger payment_attempts_updated_at
before update on public.payment_attempts
for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text,
  image_url text,
  mrp_price numeric(10,2) not null,
  sell_price numeric(10,2) not null,
  qty integer not null check (qty > 0),
  line_total numeric(10,2) not null
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists payment_attempts_order_id_idx on public.payment_attempts(order_id);

-- ============================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.site_settings enable row level security;
alter table public.banners enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.homepage_section_products enable row level security;
alter table public.coupons enable row level security;
alter table public.brand_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_attempts enable row level security;

-- Public read (catalog + settings)
drop policy if exists public_read on public.site_settings;
create policy public_read on public.site_settings
for select using (true);

drop policy if exists public_read on public.banners;
create policy public_read on public.banners
for select using (true);

drop policy if exists public_read on public.categories;
create policy public_read on public.categories
for select using (true);

drop policy if exists public_read on public.subcategories;
create policy public_read on public.subcategories
for select using (true);

drop policy if exists public_read on public.products;
create policy public_read on public.products
for select using (true);

drop policy if exists public_read on public.brands;
create policy public_read on public.brands
for select using (true);

drop policy if exists public_read on public.homepage_sections;
create policy public_read on public.homepage_sections
for select using (true);

drop policy if exists public_read on public.homepage_section_products;
create policy public_read on public.homepage_section_products
for select using (true);

drop policy if exists public_read on public.brand_settings;
create policy public_read on public.brand_settings
for select using (true);

drop policy if exists public_read_active on public.coupons;
create policy public_read_active on public.coupons
for select using (is_active = true);

-- Authenticated write (simple). You can tighten later to admin-only.
drop policy if exists auth_write on public.site_settings;
create policy auth_write on public.site_settings
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists auth_write on public.banners;
create policy auth_write on public.banners
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists auth_write on public.categories;
create policy auth_write on public.categories
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists auth_write on public.subcategories;
create policy auth_write on public.subcategories
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists auth_write on public.products;
create policy auth_write on public.products
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists auth_write on public.brands;
create policy auth_write on public.brands
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists auth_write on public.homepage_sections;
create policy auth_write on public.homepage_sections
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists auth_write on public.homepage_section_products;
create policy auth_write on public.homepage_section_products
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists auth_write on public.brand_settings;
create policy auth_write on public.brand_settings
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists auth_write on public.coupons;
create policy auth_write on public.coupons
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Orders: public can insert (checkout), but cannot read all orders.
drop policy if exists public_create_order on public.orders;
create policy public_create_order on public.orders
for insert with check (true);

drop policy if exists auth_read_orders on public.orders;
create policy auth_read_orders on public.orders
for select using (auth.role() = 'authenticated');

drop policy if exists auth_update_orders on public.orders;
create policy auth_update_orders on public.orders
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists public_create_order_item on public.order_items;
create policy public_create_order_item on public.order_items
for insert with check (true);

drop policy if exists auth_read_order_items on public.order_items;
create policy auth_read_order_items on public.order_items
for select using (auth.role() = 'authenticated');

drop policy if exists auth_update_order_items on public.order_items;
create policy auth_update_order_items on public.order_items
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists public_create_payment_attempt on public.payment_attempts;
create policy public_create_payment_attempt on public.payment_attempts
for insert with check (true);

drop policy if exists auth_read_payment_attempts on public.payment_attempts;
create policy auth_read_payment_attempts on public.payment_attempts
for select using (auth.role() = 'authenticated');

drop policy if exists auth_update_payment_attempts on public.payment_attempts;
create policy auth_update_payment_attempts on public.payment_attempts
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- ============================================================
-- SECTION 8: PERFORMANCE INDEXES
-- ============================================================
create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_subcategory_id_idx on public.products(subcategory_id);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_featured_true_idx on public.products(is_featured) where is_featured = true;
create index if not exists products_in_stock_true_idx on public.products(in_stock) where in_stock = true;
create index if not exists banners_active_sort_idx on public.banners(sort_order) where is_active = true;
create index if not exists banners_placement_sort_idx on public.banners(placement, sort_order) where is_active = true;
create index if not exists categories_slug_idx on public.categories(slug);
create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists brands_slug_idx on public.brands(slug);
create index if not exists homepage_sections_active_sort_idx on public.homepage_sections(sort_order) where is_active = true;
create index if not exists homepage_section_products_section_sort_idx on public.homepage_section_products(section_id, sort_order);
create index if not exists coupons_code_idx on public.coupons(code);
create index if not exists orders_customer_email_idx on public.orders(customer_email);
create index if not exists orders_user_id_idx on public.orders(user_id);

-- ============================================================
-- SECTION 9: SEED DATA
-- ============================================================
insert into public.site_settings (site_name, logo_url, meta_title, meta_desc, og_image, ga_id, whatsapp, business_name, business_email, business_phone, business_address, gstin, invoice_prefix, tax_rate_default, prices_tax_inclusive, invoice_terms)
values (
  'ShopKart',
  'https://placehold.co/240x80/png?text=ShopKart',
  'ShopKart - Great deals, everyday low prices',
  'ShopKart brings you unbeatable prices across electronics, fashion, and more.',
  'https://placehold.co/1200x630/png?text=ShopKart+OG',
  null,
  '7705074250',
  'ShopKart India Pvt Ltd',
  'billing@shopkart.in',
  '7705074250',
  'Gorakhpur, UP 273002',
  '29ABCDE1234F1Z5',
  'INV-',
  18.00,
  false,
  'Payment terms: 50% upfront, balance on delivery. 7 days return policy.'
)
on conflict (singleton_guard) do nothing;

insert into public.categories (name, slug, image_url, icon_emoji, sort_order, is_active)
values
  ('Electronics', 'electronics', 'https://placehold.co/600x400/png?text=Electronics', '📱', 1, true),
  ('Fashion', 'fashion', 'https://placehold.co/600x400/png?text=Fashion', '👗', 2, true),
  ('Accessories', 'accessories', 'https://placehold.co/600x400/png?text=Accessories', '👜', 3, true),
  ('Bracelets', 'bracelets', 'https://placehold.co/600x400/png?text=Bracelets', '🔮', 4, true),
  ('Home', 'home', 'https://placehold.co/600x400/png?text=Home', '🏠', 5, true),
  ('Toys', 'toys', 'https://placehold.co/600x400/png?text=Toys', '🧸', 6, true)
on conflict (slug) do nothing;

update public.categories
set image_url = case slug
  when 'electronics' then 'https://placehold.co/600x400/png?text=Electronics'
  when 'fashion' then 'https://placehold.co/600x400/png?text=Fashion'
  when 'accessories' then 'https://placehold.co/600x400/png?text=Accessories'
  when 'bracelets' then 'https://placehold.co/600x400/png?text=Bracelets'
  when 'home' then 'https://placehold.co/600x400/png?text=Home'
  when 'toys' then 'https://placehold.co/600x400/png?text=Toys'
  else image_url
end,
icon_emoji = case slug
  when 'electronics' then '📱'
  when 'fashion' then '👗'
  when 'accessories' then '👜'
  when 'bracelets' then '🔮'
  when 'home' then '🏠'
  when 'toys' then '🧸'
  else icon_emoji
end
where slug in ('electronics', 'fashion', 'accessories', 'bracelets', 'home', 'toys');

with root as (
  select id, slug from public.categories where slug in ('rudraksha', 'gemstones', 'malas', 'bracelets', 'kavach', 'yantras')
)
insert into public.categories (parent_id, name, slug, image_url, icon_emoji, sort_order, is_active)
select
  r.id,
  child.name,
  child.slug,
  child.image_url,
  child.icon_emoji,
  child.sort_order,
  true
from (
  values
    ('electronics', 'Mobile Phones', 'mobile-phones', 'https://placehold.co/600x400/png?text=Mobile+Phones', null, 1),
    ('electronics', 'Laptops', 'laptops', 'https://placehold.co/600x400/png?text=Laptops', null, 2),
    ('fashion', 'Men', 'men-fashion', 'https://placehold.co/600x400/png?text=Men+Fashion', null, 1),
    ('fashion', 'Women', 'women-fashion', 'https://placehold.co/600x400/png?text=Women+Fashion', null, 2),
    ('accessories', 'Bags', 'bags', 'https://placehold.co/600x400/png?text=Bags', null, 1),
    ('bracelets', 'Crystal', 'crystal-bracelets', 'https://placehold.co/600x400/png?text=Crystal+Bracelets', null, 1),
    ('home', 'Kitchen', 'kitchen', 'https://placehold.co/600x400/png?text=Kitchen', null, 1),
    ('toys', 'Kids', 'kids-toys', 'https://placehold.co/600x400/png?text=Kids+Toys', null, 1)
) as child(parent_slug, name, slug, image_url, icon_emoji, sort_order)
join root r on r.slug = child.parent_slug
on conflict (slug) do nothing;

update public.categories
set image_url = case slug
  when 'mobile-phones' then 'https://placehold.co/600x400/png?text=Mobile+Phones'
  when 'laptops' then 'https://placehold.co/600x400/png?text=Laptops'
  when 'men-fashion' then 'https://placehold.co/600x400/png?text=Men+Fashion'
  when 'women-fashion' then 'https://placehold.co/600x400/png?text=Women+Fashion'
  when 'bags' then 'https://placehold.co/600x400/png?text=Bags'
  when 'crystal-bracelets' then 'https://placehold.co/600x400/png?text=Crystal+Bracelets'
  when 'kitchen' then 'https://placehold.co/600x400/png?text=Kitchen'
  when 'kids-toys' then 'https://placehold.co/600x400/png?text=Kids+Toys'
  else image_url
end
where slug in ('mobile-phones', 'laptops', 'men-fashion', 'women-fashion', 'bags', 'crystal-bracelets', 'kitchen', 'kids-toys');

insert into public.brands (name, slug, logo_url, sort_order, is_active)
values
  ('ShopKart', 'shopkart', 'https://placehold.co/300x120/png?text=ShopKart', 1, true),
  ('SmartGoods', 'smartgoods', 'https://placehold.co/300x120/png?text=SmartGoods', 2, true)
on conflict (slug) do nothing;

insert into public.banners (image_url, title, subtitle, cta_text, click_url, sort_order, is_active)
values
  ('https://placehold.co/1200x600/png?text=Mega+Sale', 'Mega Sale', 'Up to 70% off on selected categories', 'Shop Now', '/', 1, true),
  ('https://placehold.co/1200x600/png?text=New+Arrivals', 'New Arrivals', 'Latest gadgets and fashion added daily', 'Explore', '/', 2, true),
  ('https://placehold.co/1200x600/png?text=Daily+Deals', 'Daily Deals', 'Handpicked offers for every budget', 'View More', '/', 3, true)
on conflict do nothing;

with cat as (
  select id, slug from public.categories where slug in (
    'rudraksha', 'nepali-rudraksha', 'indonesian-rudraksha', 'gemstones', 'healing-gemstones', 'zodiac-gemstones', 'malas', 'japa-malas', 'bracelets', 'crystal-bracelets', 'kavach', 'protection-kavach', 'yantras', 'sacred-yantras'
  )
),
brand as (
  select id, slug, name from public.brands where slug in ('gems-rudraksha-mala', 'divine-roots')
)
insert into public.products (
  name, slug, brand_id, brand_name, category_id, description, image_url, image_gallery,
  mrp_price, sell_price, in_stock, is_featured, tags, meta_title, meta_desc, sort_order
)
select
  p.name, p.slug, b.id, b.name, c.id, p.description, p.image_url, p.image_gallery,
  p.mrp_price, p.sell_price, p.in_stock, p.is_featured, p.tags, p.meta_title, p.meta_desc, p.sort_order
from (
  values
    ('Natural 5 Mukhi Rudraksha (Nepali)', 'natural-5-mukhi-rudraksha-nepali', 'gems-rudraksha-mala', 'nepali-rudraksha',
      'Classic 5 Mukhi Rudraksha sourced for daily jap and spiritual practice.', 'https://placehold.co/800x800/png?text=Rudraksha+1',
      array['https://placehold.co/800x800/png?text=Rudraksha+1A','https://placehold.co/800x800/png?text=Rudraksha+1B'],
      1299.00, 999.00, true, true, array['rudraksha','nepali','5-mukhi'], 'Natural 5 Mukhi Rudraksha (Nepali)', 'Authentic Nepali 5 Mukhi Rudraksha for daily spiritual practice.', 1),
    ('Natural 7 Mukhi Rudraksha Mala', 'natural-7-mukhi-rudraksha-mala', 'divine-roots', 'rudraksha',
      'Seven Mukhi mala selected for spiritual balance and focused chanting.', 'https://placehold.co/800x800/png?text=Rudraksha+2',
      array[]::text[], 1799.00, 1399.00, true, false, array['rudraksha','mala','7-mukhi'], null, null, 2),
    ('Rose Quartz Healing Bracelet', 'rose-quartz-healing-bracelet', 'divine-roots', 'healing-gemstones',
      'Soft pink gemstone bracelet for calm and emotional balance.', 'https://placehold.co/800x800/png?text=Gemstone+1',
      array['https://placehold.co/800x800/png?text=Gemstone+1A'], 1599.00, 1199.00, true, true, array['bracelet','rose-quartz','healing'], null, null, 1),
    ('Tiger Eye Zodiac Bracelet', 'tiger-eye-zodiac-bracelet', 'gems-rudraksha-mala', 'zodiac-gemstones',
      'Protective gemstone bracelet for confidence and grounded energy.', 'https://placehold.co/800x800/png?text=Gemstone+2',
      array[]::text[], 1499.00, 1099.00, true, false, array['bracelet','tiger-eye','zodiac'], null, null, 2),
    ('Saraswati Gyaan Kavach', 'saraswati-gyaan-kavach', 'gems-rudraksha-mala', 'protection-kavach',
      'Spiritual kavach designed for focus, wisdom, and study support.', 'https://placehold.co/800x800/png?text=Kavach+1',
      array['https://placehold.co/800x800/png?text=Kavach+1A','https://placehold.co/800x800/png?text=Kavach+1B'],
      9000.00, 8003.00, true, true, array['kavach','wisdom','protection'], null, null, 1),
    ('Shree Yantra', 'shree-yantra', 'divine-roots', 'sacred-yantras',
      'Sacred yantra kept for prosperity, balance, and devotional spaces.', 'https://placehold.co/800x800/png?text=Yantra+1',
      array[]::text[], 100000.00, 91000.00, true, false, array['yantra','prosperity','sacred'], null, null, 2)
) as p(
  name, slug, brand_slug, category_slug, description, image_url, image_gallery,
  mrp_price, sell_price, in_stock, is_featured, tags, meta_title, meta_desc, sort_order
)
join cat c on c.slug = p.category_slug
join brand b on b.slug = p.brand_slug
on conflict (slug) do nothing;

insert into public.homepage_sections (
  title,
  subtitle,
  section_type,
  product_source,
  max_items,
  ticker_text,
  ticker_speed,
  sort_order,
  is_active
)
values
  ('Featured', 'Top picks and bestsellers this week', 'products', 'manual', 8, null, 30, 1, true),
  ('New Arrivals', 'Latest products added this week', 'products', 'new_arrivals', 8, null, 30, 2, true),
  ('Offer Line', null, 'ticker', 'manual', 8, 'Great deals | Free delivery on selected products | ShopKart offers', 28, 3, true),
  ('Middle Banner', 'Promotional banner between homepage sections', 'banner', 'manual', 8, null, 30, 4, true)
on conflict do nothing;

with featured_section as (
  select id from public.homepage_sections where title = 'Featured' limit 1
),
featured_products as (
  select id, row_number() over (order by sort_order, created_at) as rn
  from public.products
  where is_featured = true
  limit 8
)
insert into public.homepage_section_products (section_id, product_id, sort_order)
select featured_section.id, featured_products.id, featured_products.rn
from featured_section, featured_products
on conflict do nothing;

insert into public.brand_settings (owner_name, tagline, bio, photo_url, instagram, youtube, facebook)
values (
  'Gems Rudraksha Mala',
  'Authentic Rudraksha, gemstones, malas, and guidance',
  'We curate spiritual essentials with careful selection, trusted sourcing, and fast support.',
  'https://placehold.co/600x600/png?text=Owner',
  'https://instagram.com/',
  'https://youtube.com/',
  'https://facebook.com/'
)
on conflict do nothing;

-- ✅ Setup complete! Go to Table Editor to verify data.
-- 🔒 RLS is ON. Only authenticated users can write.
-- 📝 Next step: Fill your own data in Table Editor.
