## Supabase handover (Techpotli / Flipkart-like store)

### 1) Environment variables
Set these in `.env.local` (dev) and in your hosting provider (prod).

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose to client)
- `NEXT_PUBLIC_SITE_URL` (used in WhatsApp/product links; example: `https://your-domain.com`)
- Razorpay (payments)
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET` (only if using webhook route)

### 2) Supabase Auth settings (required)
In Supabase dashboard:

- **Auth → URL Configuration**
  - **Site URL**: your production URL
  - **Redirect URLs**: include:
    - `http://localhost:3000/*`
    - `https://your-domain.com/*`

This project uses:
- Signup email redirect to `/account`
- Password reset redirect to `/auth/update-password`

### 3) SQL setup order
For a **fresh Supabase project** (e.g. when reusing this template for a new website), run these in Supabase SQL Editor, in this order:

1. `supabase/setup.sql`
2. `supabase/admin_policies.sql`
3. `supabase/customer_order_policies.sql`

Notes:
- `setup.sql` creates tables, RLS, and basic public read policies.
- Fresh setup includes recursive `categories.parent_id` for category trees and a `brands` table for selectable product brands.
- `admin_policies.sql` tightens writes and order access for admins via `public.is_admin()`.
- `customer_order_policies.sql` allows customers to read only their own orders (by matching `orders.customer_email` to the logged-in user’s email in the JWT).

### 4) Customer account model (important)
We allow **guest checkout**.

Orders are stored with `orders.customer_email` entered at checkout.

The customer can view their orders only if:
- They are logged in, AND
- Their logged-in email matches the email used at checkout.

### 5) Create an admin user by email
Admin access is controlled by Supabase **`app_metadata.role`** (NOT user_metadata).

Steps:
1. Create the user in Supabase (sign up from UI or create in Auth → Users).
2. In Supabase dashboard: **Auth → Users → select user**
3. Set **app_metadata** to:

```json
{ "role": "admin" }
```

4. The user must **sign out and sign in again** (to refresh JWT claims).
5. Confirm access:
   - Visiting `/admin` should work
   - Non-admin users will be redirected to `/admin-forbidden`

### 6) Common troubleshooting
- **Account profile saves but doesn’t reflect**: user metadata is refreshed via `router.refresh()` after saving, and server reads user via `supabase.auth.getUser()`. If still stale, sign out/in once.
- **Orders not visible in /account**:
  - Verify `customer_order_policies.sql` has been applied.
  - Confirm checkout stored the correct `customer_email`.
  - Confirm you are logged in with the same email.

