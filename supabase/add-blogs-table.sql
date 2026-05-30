-- ============================================================
-- FILE: supabase/add-blogs-table.sql
-- PURPOSE: Add blogs/articles table for homepage blog carousel
-- USED IN: Supabase SQL Editor (run after setup.sql)
-- ============================================================

-- ============================================================
-- SECTION: BLOGS/ARTICLES TABLE
-- ============================================================
create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  image_url text,
  category text not null default 'Blog',
  author text,
  featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint blogs_slug_format check (slug ~ '^[a-z0-9-]+$')
);

comment on table public.blogs is
  'INTERN: Blog posts and articles for homepage carousel. Add rows via Supabase Table Editor.';

create trigger blogs_updated_at
before update on public.blogs
for each row execute function public.set_updated_at();

-- Create index for faster queries
create index if not exists blogs_active_sort on public.blogs (is_active, sort_order) where is_active = true;
create index if not exists blogs_featured on public.blogs (featured) where featured = true;

-- ============================================================
-- INSERT SAMPLE BLOG DATA (optional, delete if you have real data)
-- ============================================================
insert into public.blogs (title, slug, excerpt, category, featured, sort_order) values
  (
    '7 Mukhi Rudraksha Benefits & How to Wear',
    '7-mukhi-rudraksha-benefits',
    'Discover the transformative power of 7 Mukhi Rudraksha. Learn its benefits, how to wear it, and why spiritual seekers trust this sacred bead.',
    'Rudraksha',
    true,
    1
  ),
  (
    'Complete Guide to Gemstone Selection',
    'complete-guide-gemstone-selection',
    'Choose the right gemstone for your needs. Our comprehensive guide covers properties, zodiac compatibility, and authenticity checking.',
    'Gemstones',
    true,
    2
  ),
  (
    'Astrological Benefits of Wearing Bracelets',
    'astrological-benefits-bracelets',
    'Explore how spiritual bracelets enhance your life. Learn about energy alignment, chakra activation, and planetary influence.',
    'Astrology',
    true,
    3
  ),
  (
    'How to Authenticate Natural Gemstones',
    'authenticate-natural-gemstones',
    'Lab certification matters. Learn what makes genuine gemstones valuable and how to verify authenticity from trusted sources.',
    'Mala',
    false,
    4
  )
on conflict (slug) do nothing;
