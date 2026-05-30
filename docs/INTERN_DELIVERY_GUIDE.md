## Intern Delivery Guide (Clone → Brand → Deploy → Push)

This guide is the standard workflow for delivering a new client website using this template.

### 0) Prerequisites
- Node.js installed (LTS recommended)
- Git installed
- Access to Supabase dashboard (client’s project)
- Access to Razorpay dashboard (if payments are enabled)
- Access to Vercel / hosting account

### 1) Clone the template

```bash
git clone https://github.com/Ravijha11/Techpotli-E-com-Template.git
cd Techpotli-E-com-Template
npm install
```

### 2) Environment variables
Create local env file:

```bash
cp .env.example .env.local
```

Fill `.env.local` using the Supabase and Razorpay dashboards.
Do not share keys in chat or commit them.

### 3) Supabase database + RLS (must do once per client)
In Supabase **SQL Editor**, run:

1. `supabase/setup.sql`
2. `supabase/admin_policies.sql`
3. `supabase/customer_order_policies.sql`

Then confirm:
- Catalog loads on homepage
- Admin panel can create tree-wise categories, product brands, products, and banners
- `/account` works (login required)

### 4) Auth redirect configuration (must do once per client)
Supabase dashboard → **Auth → URL Configuration**

- **Site URL**: client production domain
- **Redirect URLs** (minimum):
  - `http://localhost:3000/*`
  - `https://<client-domain>/*`

More details: `docs/SUPABASE_HANDOVER.md`

### 5) Branding for the client (fast)

#### A) Theme colors (global)
Edit:
- `app/globals.css`

Update:
- `--brand-primary`
- `--brand-primary-hover`
- `--brand-accent`

#### B) Content via Supabase (no code changes)
Use Supabase tables:
- `site_settings` (logo, site name, meta)
- `brand_settings` (tagline, socials)
- `banners`
- `categories` (root categories, subcategories, and deeper tree nodes using `parent_id`)
- `brands` (product brands/manufacturers)
- `products` (select brand + category tree node from admin)
- `homepage_sections` and `homepage_section_products` (homepage product rows, offer ticker, middle banners, and display order)
- `banners` (hero and homepage banner placements with click targets)

### 6) Make an admin user (for client/staff)
Supabase dashboard → **Auth → Users → select user → app_metadata**

```json
{ "role": "admin" }
```

Then sign out/in (refresh token) and confirm `/admin` access.

### 7) QA checklist (before delivery)
- **Homepage**: categories strip, banner, product grids
- **Product page**: images load, add to cart works
- **Cart**: drawer opens automatically after add-to-cart
- **Checkout**: Razorpay order and verify work (test mode)
- **Account**: profile save persists, orders visible for the same checkout email
- **Admin**: can add/edit products and banners
- **Admin category tree**: can add root category and child category
- **Admin products**: can select existing brand or create a new brand during upload
- **Admin homepage**: can order homepage sections, choose manual products, add ticker text, and place middle banners
- **Admin banners**: can set banner click target to product, category, or custom URL

### 8) Deploy (Vercel recommended)
1. Push to GitHub (see next step).
2. Import repo in Vercel.
3. Set env vars in Vercel Project Settings.
4. Deploy.

### 9) Push changes to GitHub
If you cloned the template and changed it:

```bash
git status
git add .
git commit -m "Client setup: branding + supabase + checkout"
git push origin main
```

### 10) Common mistakes
- Committing `.env.local` or keys (never do this).
- Forgetting to run `customer_order_policies.sql` (customers may see other orders).
- Not setting Auth redirect URLs (password reset and email confirmation break).

