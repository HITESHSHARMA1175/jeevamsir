# Design Document: UI Refresh

## Overview

This design specifies the architectural changes for the Jeewanom Ayurveda storefront visual refresh. The transformation moves from a warm amber/green earthy aesthetic (cream gradients, golden shadows, ornate borders) to a minimal clean luxury look (neutral whites, deep green/teal accent, flat surfaces, generous whitespace). The refresh is purely cosmetic — no data models, APIs, or business logic change.

## Architecture

### Approach: CSS Variable-Driven Theme Swap

The existing architecture already uses CSS custom properties in `globals.css` consumed by Tailwind's `hsl(var(...))` pattern and direct `var(...)` references in components. The refresh replaces variable values and removes inline gradient/shadow overrides in components, leaving the component tree structure intact.

**Layers of change (top to bottom):**

1. **globals.css** — New HSL values for all `:root` variables, new shadow definitions, removal of body gradient
2. **Component class overrides** — Replace hardcoded amber/earth colors with `var(...)` references or Tailwind semantic tokens
3. **Shape language** — Swap border-radius values to implement the hybrid shape system
4. **Motion** — Standardize Framer Motion configs and CSS transition values

### Design Principles

| Principle | Rule |
|-----------|------|
| Single accent | Deep green/teal (`hsl(170 42% 33%)`) is the only chromatic color outside of semantic states (error, success, warning) |
| Flat surfaces | No gradients on backgrounds, cards, or sections. Shadows only. |
| Hybrid shapes | Interactive (buttons, badges, pills) → `rounded-full`. Structural (cards, sections, panels) → `rounded-sm` (≤ 4px) |
| Generous whitespace | Section gaps ≥ 48px desktop / 32px mobile. Card padding ≥ 12px. |
| Minimal shadows | Neutral gray only (`rgba(0,0,0,...)`) — no amber/colored tints |

---

## Components and Interfaces

### 1. globals.css — Theme Variables

**Current state:** Warm amber/green HSL values, body gradient, earth-tinted shadows.

**New values:**

```css
:root {
  /* Neutral palette */
  --background: 0 0% 98%;          /* off-white */
  --foreground: 0 0% 6%;           /* near-black */
  --card: 0 0% 100%;               /* pure white */
  --card-foreground: 0 0% 6%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 6%;

  /* Deep green/teal accent */
  --primary: 170 42% 33%;
  --primary-foreground: 0 0% 100%;

  /* Supporting neutrals */
  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 95%;
  --muted-foreground: 0 0% 45%;
  --accent: 170 42% 95%;           /* light tint of primary for highlights */
  --accent-foreground: 170 42% 20%;
  --border: 0 0% 91%;
  --input: 0 0% 91%;
  --ring: 170 42% 33%;

  --radius: 0.375rem;              /* 6px for containers */

  /* Brand shortcuts */
  --brand-primary: #3d7a6e;
  --brand-primary-hover: #2f6158;
  --brand-accent: #3d7a6e;
  --brand-whatsapp: #25d366;

  /* Neutral shadows */
  --shadow-soft: 0 2px 12px rgba(0, 0, 0, 0.05);
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.08);

  /* Typography */
  --text-hero: clamp(2rem, 5vw, 3.5rem);
  --text-heading: clamp(1.25rem, 3vw, 2rem);
  --text-subheading: clamp(1rem, 2vw, 1.5rem);
}
```

**Body styles (replaces gradient):**

```css
body {
  @apply bg-background text-foreground antialiased;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  line-height: 1.6;
}
```

---

### 2. Header.tsx

**Changes:**
- Remove amber border colors (`border-[#e3d8be]`) → use `border-border`
- Remove warm shadow → minimal or no shadow
- Remove top announcement bar cream background (`bg-[#f8f1e3]`) → `bg-muted`
- Remove green-tinted logo border → `border-border`
- Navigation hover: `hover:text-primary` with 150ms transition
- Font weight: `font-medium` (500), no uppercase transforms

```tsx
// Header container
<header className="sticky top-0 z-40 border-b border-border bg-white backdrop-blur-sm">
  {/* ... */}
  <div className="flex min-h-[64px] items-center gap-4 py-2 sm:min-h-[56px] lg:min-h-[64px]">
    {/* Nav links */}
    <Link className="px-4 py-2 font-medium text-foreground/80 transition-colors duration-150 hover:text-primary">
      Home
    </Link>
  </div>
</header>
```

---

### 3. MobileBottomNav.tsx

**Changes:**
- Background: `bg-white` with top border `border-t border-border`
- Active state: `text-primary` (accent color)
- Inactive state: `text-muted-foreground`
- Add subtle upward shadow: `shadow-[0_-2px_8px_rgba(0,0,0,0.04)]`
- Minimum height: 56px (`h-14`)

```tsx
<nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)] md:hidden">
  <div className="mx-auto grid h-14 max-w-6xl grid-cols-3">
    <NavItem active={isHome} className={active ? "text-primary" : "text-muted-foreground"}>
```

---

### 4. ProductCard.tsx

**Changes:**
- Container: `rounded-sm` (≤ 4px), `border border-border`, `bg-white`
- Remove gradient backgrounds from image placeholder → `bg-muted`
- Remove ornate gradient bar (`h-1 w-12 rounded-full bg-gradient-to-r...`) → remove entirely
- Add-to-cart button: `rounded-full` (9999px)
- Image: `rounded-none` or `rounded-[2px]`
- Hover shadow: `hover:shadow-[var(--shadow-soft)]`
- Sale price color: `text-primary`
- Internal padding: `p-3` (12px minimum)
- Discount badge: flat `bg-primary text-white` instead of gradient

```tsx
<div className="group relative block h-full overflow-hidden rounded-sm border border-border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
  <div className="relative aspect-square w-full overflow-hidden bg-muted">
    {discounted && (
      <div className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
        {percent}% OFF
      </div>
    )}
    {/* ... */}
  </div>
  <div className="space-y-2 p-3">
    {/* Brand, name, price */}
    <div className="relative z-20">
      <AddToCartButton product={product} className="rounded-full" />
    </div>
  </div>
</div>
```

---

### 5. CartSheet.tsx

**Changes:**
- Background: pure white, no gradients
- Item rows: remove `rounded-2xl` and gradient → `border-b border-border` with clean layout
- Checkout CTA: `rounded-full bg-primary text-white`
- Internal padding: `p-5` (20px) on the sheet container
- Image thumbnails: `rounded-sm bg-muted`

```tsx
{/* Item row */}
<div className="flex gap-3 border-b border-border pb-4">
  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
    {/* image */}
  </div>
  {/* ... */}
</div>

{/* CTA */}
<Button className="w-full rounded-full bg-primary text-white hover:bg-primary/90">
  <Link href="/checkout">Proceed to Checkout</Link>
</Button>
```

---

### 6. ProductDetailPage (Product slug page)

**Changes:**
- Image gallery background: `bg-[hsl(0_0%_97%)]` (lightness 97%)
- Gap between image and info: `gap-8` (32px) on desktop
- Add to Cart button: `rounded-full bg-primary text-white`
- Option pills: `rounded-full border` with selected state `border-primary bg-accent`
- Section dividers: `border-t border-border` with `py-6` (24px) spacing

---

### 7. Homepage Sections (Carousel, CategoryRow, BannerSection)

**Changes:**
- Section spacing: `py-12` desktop (48px), `py-8` mobile (32px)
- Section containers: `rounded-sm` (≤ 4px) or no rounding
- Remove all gradient overlays and warm backgrounds
- Carousel overlay text: `bg-white/80 backdrop-blur-sm`
- CategoryRow items: `p-4` (16px padding), `text-center`
- CTA buttons: `rounded-full bg-primary`
- Section headings: use accent for decorative underline only

---

### 8. CheckoutForm.tsx

**Changes:**
- Page background: `bg-background` (off-white), no gradients
- Form section cards: `rounded-sm border border-border bg-white`
- Input fields: `rounded-md` (≤ 6px), `border-border`
- Submit button: `rounded-full bg-primary text-white`
- Form group spacing: `space-y-6` (24px)
- Focus ring: `focus-visible:ring-2 focus-visible:ring-primary/30`

---

### 9. Footer.tsx

**Changes:**
- Background: `bg-muted` (very light gray, lightness ~95-96%)
- Top border: `border-t border-border`
- Link columns with semi-bold headings: `font-semibold`
- Link text: `text-muted-foreground hover:text-primary`
- Vertical padding: `py-12` (48px)
- Mobile: stack columns vertically

---

### 10. WhatsAppButton.tsx

**Changes:**
- Shape: keep `rounded-full` (circular)
- Color: keep `bg-whatsapp` (brand green)
- Shadow: `shadow-[var(--shadow-soft)]` instead of `shadow-lg`
- Remove ping animation (glow effect)
- Size: `h-12 w-12` (48px) or `h-14 w-14` (56px)
- Position: `fixed bottom-6 right-5` (≥20px offset), with mobile override `bottom-24` when MobileBottomNav visible (≥12px clearance above 56px nav + safe area)

---

### 11. Motion & Transitions

**CSS transitions:**
- All interactive elements: `transition-colors duration-150 ease-out` or `duration-200`
- Card hover translate: `transition-all duration-200 ease-out`
- Max transition duration: 300ms

**Framer Motion entrance animations:**
```tsx
const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" }
};
```

**Reduced motion:**
- Existing `@media (prefers-reduced-motion: reduce)` block already handles this
- Verify Framer Motion components respect `useReducedMotion()`

---

### 12. Updated Utility Classes & Interfaces

No new TypeScript interfaces are introduced. The existing `Product`, `Category`, `SiteSettings`, `CartItem` types remain unchanged. Component prop signatures remain the same.

**Updated utility classes (globals.css):**

| Old Class | New Definition |
|-----------|---------------|
| `.shadow-soft` | `box-shadow: var(--shadow-soft)` — neutral gray |
| `.shadow-card` | `box-shadow: var(--shadow-card)` — neutral gray |
| `.surface-panel` | `rounded-sm border border-border bg-white` (no gradient, no blur) |
| `.section-shell` | `rounded-sm border border-border bg-white p-4 sm:p-5` (no gradient) |
| `.ornate-kicker` | Rename to `.section-kicker`, keep `text-primary` |
| `.ornate-title` | Rename to `.section-title`, use `font-sans font-semibold` instead of serif |

---

## Data Models

No data model changes. This is a purely visual refresh — all Supabase schemas, cart context state, and API contracts remain unchanged.

---

## Error Handling

No error handling changes. The refresh affects presentation only. Existing error boundaries, loading states, and fallback UIs retain their logic but receive updated styling consistent with the new neutral palette.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme color variables satisfy HSL range constraints

*For any* rendered page using the theme system, the following invariants hold simultaneously: `--background` has hue 0-60, saturation < 5%, lightness > 96%; `--primary` has hue 160-180, saturation 30-55%, lightness 25-42%; `--foreground` has lightness < 12%; `--muted-foreground` has lightness 40-55%; `--border` has saturation < 8%, lightness 88-94%; and shadow definitions contain only neutral gray rgba values (R ≈ G ≈ B or all zero).

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 1.10**

### Property 2: WCAG AA contrast ratio compliance

*For any* text/background color pair defined in the theme system (foreground on background, foreground on card, muted-foreground on background, primary-foreground on primary), the computed WCAG 2.1 contrast ratio SHALL be at least 4.5:1.

**Validates: Requirements 2.5**

### Property 3: Hybrid shape language consistency

*For any* structural container element (ProductCard wrapper, section container, checkout form group, cart item container) the computed border-radius SHALL be no greater than 4px, AND *for any* interactive element (add-to-cart button, checkout CTA, discount badge, option pill) the computed border-radius SHALL be 9999px or equivalent fully-rounded value.

**Validates: Requirements 4.2, 5.1, 5.3, 5.4, 6.3, 7.3, 8.2, 8.4**

### Property 4: ProductCard visual invariants

*For any* product data rendered as a ProductCard, the card SHALL have a white background (`rgb(255,255,255)`), a 1px solid border using the --border color, internal text content padding of at least 12px, and when a sale/discounted price is displayed, that price text SHALL use the accent/primary color.

**Validates: Requirements 5.2, 5.6, 5.7**

### Property 5: Transition timing constraints

*For any* interactive element (buttons, links, cards) with a CSS transition applied, the transition-duration SHALL be between 150ms and 300ms, and the timing-function SHALL be `ease-out` or `ease-in-out`. Additionally, *for any* Framer Motion entrance animation configuration, the animated properties SHALL be limited to `opacity` and `y` (translateY), and the duration SHALL not exceed 400ms.

**Validates: Requirements 12.1, 12.2, 12.4**

### Property 6: Neutral surface constraint (no gradients or warm tints)

*For any* surface element (body, header, card, cart sheet, checkout form, footer), the computed background SHALL be a flat solid color with no CSS `gradient` function present, and any box-shadow rgba values SHALL have R = G = B (no warm/amber color channel bias).

**Validates: Requirements 1.9, 3.1, 4.3, 7.1, 8.1**


---

## Testing Strategy

### Unit Tests (Example-based)
- Verify exact CSS variable values (--card = pure white, --radius = 0.375rem)
- Verify body has no gradient in its background style
- Verify Header renders with white bg, border-bottom, correct min-height
- Verify MobileBottomNav active/inactive color states
- Verify WhatsAppButton positioning and size
- Verify Footer background lightness and top border
- Verify prefers-reduced-motion media query disables animations

### Property Tests
- **Theme HSL ranges** (Property 1): Parse all theme CSS variables and validate HSL channel constraints
- **WCAG contrast** (Property 2): Compute luminance contrast for all text/background pairs
- **Hybrid shape language** (Property 3): For generated component variants, verify radius rules
- **ProductCard invariants** (Property 4): For any product data, verify card visual constraints
- **Transition timing** (Property 5): For interactive elements, validate duration/easing bounds
- **Neutral surfaces** (Property 6): Verify no gradient functions or warm-tinted shadows exist

### Visual Regression
- Snapshot tests for key pages (homepage, product detail, checkout) at desktop and mobile widths
- Compare before/after to catch unintended layout shifts
