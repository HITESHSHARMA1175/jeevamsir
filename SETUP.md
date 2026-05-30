## Techpotli E‑Com Engine (Intern Setup)

This repo is a **Next.js + Supabase** e-commerce template for Techpotli.
You will fill products/banners/logo in **Supabase Dashboard**, then deploy to **Vercel**.
Checkout supports **Razorpay payments** and a **WhatsApp support button**.

## ✅ 1) What you need before starting
- ✅ Node.js 18+ (`https://nodejs.org`)
- ✅ Cursor AI (`https://cursor.com`)
- ✅ Git (`https://git-scm.com`)
- ✅ GitHub account
- ✅ Supabase account (`https://supabase.com`)
- ✅ Razorpay account (`https://razorpay.com`) (for payments)

## 🔧 2) First time setup (20 mins)
1. ✅ Fork the repo on GitHub (a fork is your own copy of the project).
2. ✅ Clone your fork:

```bash
git clone <your-fork-url>
cd ecom
```

3. ✅ Install:

```bash
npm install
```

4. ✅ Create env file:

```bash
cp .env.example .env.local
```

## 📝 3) Supabase setup (15 mins)
1. ✅ Create a new Supabase project.
2. ✅ Go to **Settings → API**:
   - Copy **Project URL** → `.env.local` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **Publishable key (or anon public key)** → `.env.local` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Copy **Service role key** → `.env.local` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ server only)
3. ✅ Go to **SQL Editor** → **New query**
4. ✅ Paste and run: `supabase/setup.sql`
5. ✅ Then paste and run: `supabase/admin_policies.sql` (enables safe /admin writes + Storage bucket)
5. ✅ Verify tables in **Table Editor**:
   - `site_settings` (should have 1 row)
   - `categories`, `products`, `banners`

## 🔐 3.1) Make your user an Admin (required for /admin)
Supabase stores roles on the user in **app_metadata** (not user metadata).

### Option A (recommended): Use Supabase Dashboard SQL
1. ✅ Sign up / log in once on your site (`/auth/login`)
2. ✅ In Supabase Dashboard → SQL Editor, run:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
where email = 'YOUR_EMAIL_HERE';
```

3. ✅ Log out and log in again (so the JWT refreshes)
4. ✅ Visit `/admin`

## 🖼️ 4) Upload images (logo/products/banners)
1. ✅ Go to **Storage** in Supabase.
2. ✅ Create a bucket named `public` (or any name you prefer).
3. ✅ Upload images (logo, product photos, banners).
4. ✅ Copy the **public URL** and paste it into:
   - `site_settings.logo_url`
   - `products.image_url` / `products.image_gallery`
   - `banners.image_url`

## ✅ 5) Add client content (30 mins)
Use **Table Editor** like a spreadsheet.

- ✅ `site_settings` (1 row only)
  - `site_name`: brand name
  - `whatsapp`: format `91XXXXXXXXXX` (no `+`, no spaces)
  - `meta_title` / `meta_desc`: SEO defaults

- ✅ `products`
  - `slug` must be lowercase + dashes only:
    - ✅ `red-silk-saree`
    - ❌ `Red Silk Saree`
  - `mrp_price` and `sell_price` are numbers
  - `sell_price` must be `<= mrp_price`

## 🧪 6) Test locally

```bash
npm run dev
```

Open `http://localhost:3000` and check:
- [ ] Homepage loads (banners + products)
- [ ] Product page opens
- [ ] Add to cart works
- [ ] Checkout opens Razorpay
- [ ] WhatsApp button opens correct number

## 💳 7) Razorpay setup (10–20 mins)
1. ✅ In Razorpay dashboard, get:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
2. ✅ Add a webhook (recommended for production):
   - Endpoint: `/api/razorpay/webhook`
   - Secret: set `RAZORPAY_WEBHOOK_SECRET` in `.env.local`

## 🚀 8) Deploy to Vercel (10 mins)
**Option A (easiest):** Vercel website
1. ✅ Go to `https://vercel.com`
2. ✅ New Project → import GitHub repo
3. ✅ Add env vars (same as `.env.local`)
4. ✅ Deploy

## ✅ 9) Pre-delivery checklist
- [ ] Logo shows correctly
- [ ] WhatsApp number works
- [ ] All products have images
- [ ] Prices show in ₹ format
- [ ] Checkout works in Razorpay test mode
- [ ] Page title shows correct brand name

## ❌ Common errors & fixes
- **“Cannot read properties of null”** → `site_settings` table is empty → add 1 row
- **Images not showing** → use full **public URL** from Supabase Storage
- **WhatsApp wrong number** → ensure `91XXXXXXXXXX` format
- **Payment verify fails** → check `RAZORPAY_KEY_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`

