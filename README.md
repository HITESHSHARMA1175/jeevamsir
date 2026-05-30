# Techpotli E‑com Template (Agency Starter)

This repository is our **reusable agency template** for quickly delivering:
- **E‑commerce** sites (catalog + cart + checkout + orders + admin panel)
- **Information websites** (same base UI + CMS-like tables in Supabase)

It’s built with **Next.js (App Router) + Tailwind + shadcn/ui + Supabase + Razorpay**.

## Quick start (local)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Supabase setup (required)

Use this section **every time you clone this repo for a new client / new website** (fresh Supabase project).

1. Create a new Supabase project.
2. In Supabase **SQL Editor**, run these files **in order**:
   - `supabase/setup.sql` (schema + seed + baseline RLS)
   - `supabase/admin_policies.sql` (admin-only writes + storage policies)
   - `supabase/customer_order_policies.sql` (customers can read only their own orders)
3. Configure Auth redirect URLs (see `docs/SUPABASE_HANDOVER.md`).

Notes:
- Fresh installs already include product brands, tree-wise categories, products, banners, orders, and admin-ready policies.
- Product brands and all category levels are managed from the admin panel. Use **Categories** for category/subcategory/deeper tree nodes, and **Products** for brand select/create during upload.
- Homepage layout is managed from **Admin → Homepage**. Use it for product sections, offer ticker lines, middle banners, and section ordering after the hero.
- Admin access is granted by setting the user’s `app_metadata.role = "admin"` (see `docs/SUPABASE_HANDOVER.md`).

## Deploy (recommended: Vercel)
- Import the repo into Vercel.
- Add the same environment variables from `.env.local` in Vercel Project Settings.
- Deploy.

## Intern / delivery guide
Start here:
- `docs/INTERN_DELIVERY_GUIDE.md`
- `docs/SUPABASE_HANDOVER.md`

## Agency rules (important)
- Never commit `.env.local` or any keys.
- All client branding should be done via:
  - `app/globals.css` brand tokens (`--brand-primary`, `--brand-accent`, etc.)
  - Supabase tables: `site_settings`, `brand_settings`, `banners`, `categories`, `products`

# Ecom-template
# Ecom-template
