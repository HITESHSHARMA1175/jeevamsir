# Supabase migrations

This folder contains the SQL needed to provision and harden the
Techpotli E-Com Engine database. Files are designed to be **idempotent**
(safe to re-run) so a teammate can drop in and apply only the migrations
they care about — for example the SEO team can re-run `007_seo.sql`
after editing it without touching anything else.

## Run order

Apply these in the Supabase SQL editor (or via `supabase db push`) in this
exact order on a fresh project:

| # | File | What it adds |
| - | ---- | ------------- |
| 1 | `setup.sql` | Base schema: site_settings, banners, categories, subcategories, brands, products, homepage_sections, coupons, brand_settings, orders, order_items, payment_attempts. Includes RLS, indexes, and seed data. |
| 2 | `admin_policies.sql` | Tightens RLS so writes require `public.is_admin()` (the JWT role check). Sets up the `public` Storage bucket with admin-write policies. |
| 3 | `customer_order_policies.sql` | Lets logged-in customers read **only** their own orders/items via `auth.jwt() ->> 'email'`. |
| 4 | `005_product_attributes_and_gallery.sql` | Caps `products.image_gallery` at 6 images, adds `products.attributes` jsonb, adds `order_items.selected_options` jsonb, adds `accepted_at` / `cancelled_at` / `cancellation_reason` on orders. |
| 5 | `006_reviews.sql` | `product_reviews` table with `pending/approved/rejected` enum, a trigger that forces non-admin inserts to `pending`, and the `product_review_stats` aggregate view. |
| 6 | `007_seo.sql` | Extends `site_settings` with GTM/GSC verification, business identity, robots default, default keywords. New `seo_pages` (per-path overrides) and `seo_keywords` (research) tables. |
| 7 | `008_billing.sql` | GST-ready invoicing: `invoices` table with auto invoice number, business GSTIN/billing fields on `orders` and `site_settings`, private `invoices` storage bucket. |
| 8 | `009_wishlist.sql` | Per-customer wishlist (`wishlists` table) with own-row RLS. |
| 9 | `010_tax_inclusive.sql` | Adds `site_settings.prices_tax_inclusive boolean default true` so sell prices can be treated as GST-inclusive (the invoice API reverse-extracts the GST so totals match what the customer paid). |

## Idempotency

Every migration uses `if not exists`, `add column if not exists`,
`drop policy if exists ... create policy ...`, and similar guards.
Running a migration twice is a no-op.

## How to add a new migration

1. Create `NNN_<short_name>.sql` (next number).
2. Start with a header comment that includes purpose, dependencies, and
   "IDEMPOTENT: Safe to re-run any time."
3. Use `add column if not exists` rather than `add column`.
4. For RLS policies use the `drop policy if exists ... create policy ...`
   pattern.
5. Update this README's run-order table.

## How the SEO team re-runs `007_seo.sql` safely

Because every block uses `add column if not exists` and the policy
recreate pattern, re-running `007_seo.sql` will only add new columns
and refresh policies — it will never drop data.

## Storage buckets

| Bucket | Public? | Created by |
| ------ | ------- | ---------- |
| `public` | Yes (read), admin-write | `admin_policies.sql` |
| `invoices` | No (signed URLs only), admin-write | `008_billing.sql` |
