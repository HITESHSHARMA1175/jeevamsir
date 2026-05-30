// ============================================
// FILE: types/index.ts
// PURPOSE: Central TypeScript types for DB + UI
// USED IN: utils/store/*, context/CartContext, components/store/*
// INTERN NOTE: You can add new types here as the app grows.
// ============================================

// =========================
// SECTION 1: DATABASE TYPES
// =========================

/**
 * SiteSettings
 * Purpose: Maps to `site_settings` (global brand/SEO/contact settings).
 * INTERN NOTE: Edit values in Supabase Table Editor (1 row only).
 */
export type SiteSettings = {
  id: string;
  site_name: string;
  logo_url: string | null;
  footer_copyright?: string | null;
  meta_title: string;
  meta_desc: string;
  og_image: string | null;
  ga_id: string | null;
  whatsapp: string;
  // SEO additions (007_seo.sql)
  meta_keywords?: string[];
  default_og_title?: string | null;
  default_og_desc?: string | null;
  robots_index_default?: boolean;
  gtm_id?: string | null;
  gsc_verification?: string | null;
  bing_verification?: string | null;
  schema_org_type?: string | null;
  business_name?: string | null;
  business_address?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  // Billing additions (008_billing.sql)
  gstin?: string | null;
  invoice_prefix?: string | null;
  invoice_terms?: string | null;
  tax_rate_default?: number | null;
  // 010_tax_inclusive.sql — when true, sell prices already include GST.
  prices_tax_inclusive?: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
};

/**
 * Banner
 * Purpose: Maps to `banners` (homepage hero carousel).
 * INTERN NOTE: Add rows in Supabase to update the homepage banners.
 */
export type Banner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  click_url: string | null;
  placement?: "hero" | "section" | "middle" | "campaign";
  section_id?: string | null;
  target_type?: "none" | "custom_url" | "product" | "category";
  target_product_id?: string | null;
  target_category_id?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date | null;
  product?: Product | null;
  category?: Category | null;
};

/**
 * Category
 * Purpose: Maps to `categories` (product groupings).
 * INTERN NOTE: Keep slugs lowercase with dashes (e.g. "natural-rudraksha").
 */
export type Category = {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  image_url: string | null;
  icon_emoji: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date | null;
  updated_at?: Date | null;
};

export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
  depth: number;
};

/**
 * Subcategory
 * Purpose: Maps to `subcategories` (nested product groupings under a category).
 */
export type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date | null;
};

/**
 * Brand
 * Purpose: Maps to `brands` (product brands/manufacturers).
 */
export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
};

/**
 * ProductAttributeGroup
 * Flexible per-product attribute group (size / color / type / heading).
 */
export type ProductAttributeGroup = {
  label: string;
  options: string[];
};

/**
 * Product
 * Purpose: Maps to `products` (catalog + pricing + SEO).
 * INTERN NOTE: `slug` must be lowercase letters/numbers/dashes only.
 */
export type Product = {
  id: string;
  name: string;
  brand_name?: string | null;
  brand_id?: string | null;
  slug: string;
  category_id: string | null;
  subcategory_id?: string | null;
  description: string | null;
  image_url: string;
  image_gallery: string[];
  mrp_price: number;
  sell_price: number;
  in_stock: boolean;
  is_featured: boolean;
  tags: string[];
  meta_title: string | null;
  meta_desc: string | null;
  sort_order: number;
  attributes?: ProductAttributeGroup[];
  created_at: Date | null;
  updated_at: Date | null;
  // Joined field (when fetched with category):
  category?: Category;
  brand?: Brand | null;
};

/**
 * ProductReviewStatus
 * Maps to `review_status` enum.
 */
export type ProductReviewStatus = "pending" | "approved" | "rejected";

/**
 * ProductReview
 * Purpose: Maps to `product_reviews`.
 */
export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ProductReviewStatus;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * ProductReviewStats
 * Aggregated approved-review stats from `product_review_stats` view.
 */
export type ProductReviewStats = {
  product_id: string;
  review_count: number;
  avg_rating: number | null;
};

/**
 * SeoPage
 * Per-path SEO override row from `seo_pages`.
 */
export type SeoPage = {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  keywords: string[];
  og_title: string | null;
  og_desc: string | null;
  og_image: string | null;
  canonical_url: string | null;
  robots_index: boolean | null;
  json_ld: Record<string, unknown> | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * SeoKeyword
 * Keyword research row from `seo_keywords`.
 */
export type SeoKeyword = {
  id: string;
  keyword: string;
  search_volume: number | null;
  difficulty: number | null;
  target_path: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * Invoice
 * Purpose: Maps to `invoices`.
 */
export type Invoice = {
  id: string;
  order_id: string;
  invoice_number: string;
  issued_at: string | null;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  gstin: string | null;
  billing_name: string | null;
  billing_address: string | null;
  billing_phone: string | null;
  billing_email: string | null;
  pdf_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * WishlistItem
 * Maps to `wishlists` rows.
 */
export type WishlistItem = {
  user_id: string;
  product_id: string;
  created_at: string | null;
};

export type HomepageSectionType = "products" | "ticker" | "banner";
export type HomepageProductSource =
  | "manual"
  | "featured"
  | "new_arrivals"
  | "category"
  | "brand";
export type HomepageBannerLayout = "wide" | "grid" | "split";

export type HomepageSectionProduct = {
  section_id: string;
  product_id: string;
  sort_order: number;
  created_at: Date | null;
  product?: Product;
};

export type HomepageSection = {
  id: string;
  title: string;
  subtitle: string | null;
  section_type: HomepageSectionType;
  product_source: HomepageProductSource;
  category_id: string | null;
  brand_id: string | null;
  max_items: number;
  ticker_text: string | null;
  ticker_speed: number;
  banner_layout: HomepageBannerLayout;
  background_color: string | null;
  auto_banner_enabled: boolean;
  auto_insert_after_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
  products?: Product[];
  banners?: Banner[];
  category?: Category | null;
  brand?: Brand | null;
};

/**
 * BrandSettings
 * Purpose: Maps to `brand_settings` (influencer/personal brand info).
 * INTERN NOTE: Use this for About page content and footer social links.
 */
export type BrandSettings = {
  id: string;
  owner_name: string | null;
  tagline: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  youtube: string | null;
  facebook: string | null;
  created_at: Date | null;
};

/**
 * Blog
 * Purpose: Maps to `blogs` (blog posts for homepage carousel).
 * INTERN NOTE: Add rows in Supabase to add new blog posts.
 */
export type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string;
  author: string | null;
  featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: Date | null;
  updated_at: Date | null;
};

/**
 * OrderStatus
 * Purpose: Maps to `order_status` enum in Postgres.
 * INTERN NOTE: Keep this in sync with the DB enum values.
 */
export type OrderStatus =
  | "created"
  | "paid"
  | "failed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * Order
 * Purpose: Maps to `orders` (checkout + payment tracking).
 * INTERN NOTE: View/update in Supabase Table Editor (admin ops).
 */
export type Order = {
  id: string;
  created_at: Date | null;
  user_id?: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  alternate_phone?: string | null;
  shipping_address: string | null;
  address_line?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  landmark?: string | null;
  currency: string;
  subtotal_amount?: number;
  discount_amount?: number;
  coupon_id?: string | null;
  coupon_code?: string | null;
  total_amount: number;
  status: OrderStatus;
  payment_method?: "cod" | "razorpay" | "phonepe";
  payment_status?: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  whatsapp_phone: string | null;
  // 005_product_attributes_and_gallery.sql
  accepted_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  // 008_billing.sql
  gstin?: string | null;
  billing_name?: string | null;
  billing_address?: string | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  starts_at: Date | null;
  expires_at: Date | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  used_count: number;
  applies_to: "all" | "category" | "product" | "brand";
  category_id: string | null;
  product_id: string | null;
  brand_id: string | null;
  is_active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
};

export type PaymentAttempt = {
  id: string;
  order_id: string;
  provider: "cod" | "razorpay" | "phonepe";
  status: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_signature: string | null;
  raw_metadata: Record<string, unknown>;
  created_at: Date | null;
  updated_at: Date | null;
};

/**
 * OrderItem
 * Purpose: Maps to `order_items` (line items for an order).
 * INTERN NOTE: This is written automatically by checkout code.
 */
export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  image_url: string | null;
  mrp_price: number;
  sell_price: number;
  qty: number;
  line_total: number;
  selected_options?: Record<string, string>;
};

// =====================
// SECTION 2: CART TYPES
// =====================

/**
 * CartItem
 * Purpose: Minimal data needed to render and checkout from the cart.
 * INTERN NOTE: If you add variants (size/color), add fields here.
 */
export type CartItem = {
  id: string;
  name: string;
  image_url: string;
  sell_price: number;
  mrp_price: number;
  qty: number;
  slug: string;
  selected_options?: Record<string, string>;
};

/**
 * CartState
 * Purpose: Cart reducer state shape (stored in localStorage).
 * INTERN NOTE: Keep it small; cart is client-side only.
 */
export type CartState = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
};

/**
 * CartAction
 * Purpose: All reducer actions for cart state updates.
 * INTERN NOTE: Add new actions only if needed.
 */
export type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "INCREMENT"; payload: { id: string } }
  | { type: "DECREMENT"; payload: { id: string } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; payload: CartItem[] };

// =========================
// SECTION 3: CONTEXT TYPE
// =========================

/**
 * CartContextType
 * Purpose: Public API exposed by `useCart()` to components.
 * INTERN NOTE: Use these methods in UI; do not mutate state directly.
 */
export type CartContextType = CartState & {
  addItem: (
    product: Product,
    selectedOptions?: Record<string, string>,
  ) => void;
  removeItem: (id: string) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getItemQty: (id: string) => number;
};

// =========================
// SECTION 4: PAGE PROP TYPES
// =========================

/**
 * PageProps
 * Purpose: Standard Next.js App Router page props.
 * INTERN NOTE: Useful for typing `params` and `searchParams`.
 */
export type PageProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

/**
 * WithClassName
 * Purpose: Common React pattern for optional Tailwind className props.
 * INTERN NOTE: Use this on small presentational components.
 */
export type WithClassName = { className?: string };

