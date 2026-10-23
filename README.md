# Jeewanom Ayurveda

A modern Ayurvedic e-commerce storefront built with **Next.js**, **TypeScript**, **React**, **Tailwind CSS**, and **Supabase**.

The application is designed for selling authentic Ayurvedic medicines, herbal supplements, wellness products, skincare, haircare, herbal powders, and teas online.

**Live website:** [jeewanom.com](https://jeewanom.com)

## Features

- Responsive Ayurvedic product storefront
- Product catalog with categories, subcategories, brands, tags, and featured products
- Homepage banners, campaign sections, category rows, and configurable content sections
- Product search through the `q` query parameter
- Shopping cart and customer account state
- Customer order history with row-level access controls
- Wishlist support
- Product reviews with moderation states
- Coupon and promotional banner support
- Razorpay payment integration
- GST-ready billing and invoice generation
- SEO metadata, Open Graph support, JSON-LD structured data, sitemap-friendly site settings, and robots configuration
- Google Tag Manager, Google Search Console, and Bing verification support
- Supabase Storage integration for product media and invoices
- Admin-controlled catalog, homepage, branding, SEO, orders, and billing data
- Mobile bottom navigation and WhatsApp contact button
- Light theme optimized for a wellness and Ayurveda storefront

## Tech stack

- [Next.js](https://nextjs.org/) with the App Router
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) for PostgreSQL, authentication, storage, and row-level security
- [Razorpay](https://razorpay.com/) for payments
- [Radix UI](https://www.radix-ui.com/) for accessible UI primitives
- [Framer Motion](https://motion.dev/) for animations
- `@react-pdf/renderer` for PDF invoice generation

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project
- Razorpay credentials for payment processing

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/HITESHSHARMA1175/jeevamsir.git
cd jeevamsir
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase and site details:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The service-role key is server-only and must never be exposed in client-side code or committed to the repository.

Payment-related variables may also be required by the payment API routes. Add the Razorpay credentials expected by the deployment environment before testing checkout or payment flows.

### 4. Set up Supabase

Apply the SQL migrations in `supabase/` in the documented order. See [`supabase/README.md`](supabase/README.md) for the complete migration sequence, database responsibilities, row-level security policies, and storage buckets.

For a fresh Supabase project, apply the migrations using the Supabase SQL Editor or the Supabase CLI:

```bash
supabase db push
```

Make sure the database is populated with the required site settings, categories, products, banners, and brand configuration before opening the storefront.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server with Webpack |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint across the project |

## Project structure

```text
.
├── app/                 # Next.js routes, pages, layouts, and API handlers
├── components/          # Reusable UI and storefront components
├── context/              # Cart and authenticated store-user state
├── docs/                 # Project documentation
├── lib/                  # Shared libraries and integrations
├── public/               # Static assets and site files
├── supabase/             # Database migrations and Supabase setup notes
├── types/                # Shared TypeScript types
├── utils/                # Data queries, SEO helpers, and application utilities
├── .env.example         # Environment variable template
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json          # Dependencies and npm scripts
```

## Data and security

Supabase row-level security policies protect customer-specific data. Customer order access is restricted to the authenticated customer, while administrative writes are controlled through the project’s admin policies.

Keep the following values private:

- `SUPABASE_SERVICE_ROLE_KEY`
- Razorpay secret credentials
- Any other server-side API keys

Do not commit `.env.local` or production secrets to Git.

## Deployment

The application can be deployed to a Next.js-compatible hosting provider such as Vercel.

Before deploying:

1. Configure all production environment variables.
2. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
3. Apply the Supabase migrations.
4. Configure Supabase authentication redirect URLs.
5. Configure Razorpay webhook and callback URLs.
6. Verify storage bucket policies and row-level security rules.
7. Run a production build locally:

```bash
npm run build
npm run start
```

## Database migrations

Database migrations are intentionally designed to be idempotent and safe to re-run. The migration documentation includes setup instructions for:

- Base catalog and order tables
- Admin and customer policies
- Product attributes and image galleries
- Product reviews
- SEO configuration
- GST-ready invoices
- Wishlists
- Tax-inclusive pricing

See [`supabase/README.md`](supabase/README.md) for details.

## Contributing

1. Create a feature branch.
2. Make focused changes.
3. Run linting and a production build.
4. Test storefront, authentication, cart, checkout, and admin flows affected by your changes.
5. Open a pull request with a clear description of the changes.

```bash
npm run lint
npm run build
```

## License

No license has been specified for this repository yet. Contact the repository owner before redistributing or using the code commercially.
