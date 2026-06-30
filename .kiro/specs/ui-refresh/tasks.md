# Implementation Plan: UI Refresh

## Overview

A purely visual refresh of the Jeewanom Ayurveda e-commerce storefront. The implementation follows a top-down approach: update CSS custom properties in `globals.css` first (establishing the new neutral palette, shadows, and typography), then sweep through each component to replace hardcoded earthy/amber classes with semantic token references and apply the hybrid shape language (rounded interactives, squared containers).

## Tasks

- [x] 1. Update global theme variables and body styles
  - [x] 1.1 Replace all CSS custom property values in `globals.css` `:root` block
    - Set `--background: 0 0% 98%`, `--foreground: 0 0% 6%`, `--card: 0 0% 100%`
    - Set `--primary: 170 42% 33%`, `--primary-foreground: 0 0% 100%`
    - Set `--secondary: 0 0% 96%`, `--muted: 0 0% 95%`, `--muted-foreground: 0 0% 45%`
    - Set `--accent: 170 42% 95%`, `--accent-foreground: 170 42% 20%`
    - Set `--border: 0 0% 91%`, `--input: 0 0% 91%`, `--ring: 170 42% 33%`
    - Set `--radius: 0.375rem`
    - Add `--brand-primary: #3d7a6e`, `--brand-primary-hover: #2f6158`, `--brand-accent: #3d7a6e`, `--brand-whatsapp: #25d366`
    - Add `--shadow-soft: 0 2px 12px rgba(0, 0, 0, 0.05)` and `--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.08)`
    - Add typography variables `--text-hero`, `--text-heading`, `--text-subheading`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 2.2_

  - [x] 1.2 Update body styles and utility classes in `globals.css`
    - Remove body gradient background, apply `@apply bg-background text-foreground antialiased`
    - Set `font-family: 'Inter', system-ui, -apple-system, sans-serif` and `line-height: 1.6`
    - Update `.shadow-soft` and `.shadow-card` to use new neutral rgba values
    - Update `.surface-panel` to `rounded-sm border border-border bg-white` (no gradient)
    - Update `.section-shell` to `rounded-sm border border-border bg-white p-4 sm:p-5`
    - Rename `.ornate-kicker` → `.section-kicker` with `text-primary`
    - Rename `.ornate-title` → `.section-title` with `font-sans font-semibold`
    - Add `@media (prefers-reduced-motion: reduce)` rule disabling non-essential transitions
    - _Requirements: 1.9, 2.1, 2.3, 2.4, 12.1, 12.2, 12.3_

  - [x] 1.3 Write property test for theme HSL constraints
    - **Property 1: Theme color variables satisfy HSL range constraints**
    - Parse CSS variable values and validate hue/saturation/lightness ranges
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 1.10**

  - [x] 1.4 Write property test for WCAG AA contrast compliance
    - **Property 2: WCAG AA contrast ratio compliance**
    - Compute luminance contrast for foreground/background, foreground/card, muted-foreground/background, primary-foreground/primary pairs
    - **Validates: Requirements 2.5**

- [x] 2. Refresh Header and Navigation
  - [x] 2.1 Update `Header.tsx` styling
    - Replace amber border (`border-[#e3d8be]`) with `border-border`
    - Remove warm shadow, set white background `bg-white`
    - Replace announcement bar cream bg (`bg-[#f8f1e3]`) with `bg-muted`
    - Remove green-tinted logo border → `border-border`
    - Set nav link hover: `hover:text-primary` with `transition-colors duration-150`
    - Set font weight `font-medium` (500), remove uppercase transforms
    - Ensure min height `min-h-[64px]` desktop, `min-h-[56px]` mobile
    - Add subtle bottom border `border-b border-border`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.2 Write unit tests for Header component
    - Verify white background, bottom border presence, min-height values
    - Verify hover transition class and accent color usage
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 3. Refresh Homepage sections
  - [x] 3.1 Update Carousel, CategoryRow, BannerSection, and product grid sections
    - Set section spacing `py-12` desktop (48px), `py-8` mobile (32px)
    - Apply `rounded-sm` (≤ 4px) on section containers
    - Remove all gradient overlays and warm backgrounds
    - Set carousel overlay text to `bg-white/80 backdrop-blur-sm`
    - Set CategoryRow items: `p-4` padding, `text-center` alignment
    - Set CTA buttons: `rounded-full bg-primary`
    - Set section heading accent decorative underline only with `text-primary`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.2 Write property test for neutral surface constraint
    - **Property 6: Neutral surface constraint (no gradients or warm tints)**
    - Verify no CSS `gradient` function present in surface backgrounds
    - Verify box-shadow rgba values have R = G = B
    - **Validates: Requirements 1.9, 3.1, 4.3, 7.1, 8.1**

- [x] 4. Refresh ProductCard component
  - [x] 4.1 Update `ProductCard.tsx` styling
    - Set container: `rounded-sm border border-border bg-white`
    - Remove gradient backgrounds from image placeholder → `bg-muted`
    - Remove ornate gradient bar (`h-1 w-12 rounded-full bg-gradient-to-r...`)
    - Set add-to-cart button: `rounded-full`
    - Set image: `rounded-none` or `rounded-[2px]`
    - Add hover shadow: `hover:shadow-[var(--shadow-soft)]` with `hover:-translate-y-0.5`
    - Set sale price color: `text-primary`
    - Set internal padding: `p-3` (12px minimum)
    - Set discount badge: flat `bg-primary text-white rounded-full` (no gradient)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 4.2 Write property test for ProductCard visual invariants
    - **Property 4: ProductCard visual invariants**
    - Verify white background, 1px border, ≥12px text padding, sale price in accent color
    - **Validates: Requirements 5.2, 5.6, 5.7**

  - [x] 4.3 Write property test for hybrid shape language
    - **Property 3: Hybrid shape language consistency**
    - Verify structural containers ≤ 4px radius, interactive elements use 9999px radius
    - **Validates: Requirements 4.2, 5.1, 5.3, 5.4, 6.3, 7.3, 8.2, 8.4**

- [x] 5. Checkpoint - Verify core visual foundation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Refresh CartSheet and Checkout
  - [x] 6.1 Update `CartSheet.tsx` styling
    - Set background: pure white, no gradients
    - Replace item row `rounded-2xl` and gradient with `border-b border-border` layout
    - Set checkout CTA: `rounded-full bg-primary text-white`
    - Set internal padding: `p-5` (20px) on sheet container
    - Set image thumbnails: `rounded-sm bg-muted`
    - Set overlay: `bg-black/40` (neutral dark, opacity 0.3–0.5)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.2 Update `CheckoutForm.tsx` styling
    - Set page background: `bg-background` (off-white), no gradients
    - Set form section cards: `rounded-sm border border-border bg-white`
    - Set input fields: `rounded-md` (≤ 6px), `border-border`
    - Set submit button: `rounded-full bg-primary text-white`
    - Set form group spacing: `space-y-6` (24px)
    - Set focus ring: `focus-visible:ring-2 focus-visible:ring-primary/30`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 6.3 Write unit tests for CartSheet and CheckoutForm
    - Verify CartSheet white bg, border separation, rounded-full CTA
    - Verify CheckoutForm input border-radius, focus ring, form group spacing
    - _Requirements: 7.1, 7.3, 8.2, 8.4, 8.6_

- [x] 7. Refresh Footer and WhatsApp Button
  - [x] 7.1 Update `Footer.tsx` styling
    - Set background: `bg-muted` (very light gray, ~95-96% lightness)
    - Add top border: `border-t border-border`
    - Set link column headings: `font-semibold`
    - Set link text: `text-muted-foreground hover:text-primary`
    - Set vertical padding: `py-12` (48px)
    - Ensure mobile stacks columns vertically with maintained padding
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 7.2 Update `WhatsAppButton.tsx` styling
    - Keep `rounded-full` (circular) shape
    - Keep WhatsApp brand green color (`bg-[#25d366]` or `bg-[var(--brand-whatsapp)]`)
    - Set shadow: `shadow-[var(--shadow-soft)]` (remove `shadow-lg` / glow)
    - Remove ping/glow animation
    - Set size: `h-12 w-12` (48px) or `h-14 w-14` (56px)
    - Set position: `fixed bottom-6 right-5` (≥20px offset)
    - Add mobile override: `bottom-24` when MobileBottomNav visible (≥12px clearance)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 7.3 Write unit tests for Footer and WhatsAppButton
    - Verify Footer bg-muted, top border, link hover colors
    - Verify WhatsAppButton size, shadow, position offset
    - _Requirements: 9.1, 9.4, 10.2, 10.3, 10.5_

- [x] 8. Refresh MobileBottomNav and Product Detail Page
  - [x] 8.1 Update `MobileBottomNav.tsx` styling
    - Set background: `bg-white` with `border-t border-border`
    - Set active state: `text-primary`
    - Set inactive state: `text-muted-foreground`
    - Add upward shadow: `shadow-[0_-2px_8px_rgba(0,0,0,0.04)]`
    - Set minimum height: `h-14` (56px)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 8.2 Update Product Detail Page styling
    - Set image gallery background: `bg-[hsl(0_0%_97%)]`
    - Set gap between image and info: `gap-8` (32px) on desktop
    - Set Add to Cart button: `rounded-full bg-primary text-white`
    - Set option pills: `rounded-full border` with selected state `border-primary bg-accent`
    - Set section dividers: `border-t border-border` with `py-6` (24px) spacing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 8.3 Write unit tests for MobileBottomNav
    - Verify white bg, top border, active/inactive color states, min height
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 9. Standardize motion and transitions
  - [x] 9.1 Audit and update transition values across all refreshed components
    - Ensure all interactive elements use `transition-colors duration-150 ease-out` or `duration-200`
    - Ensure card hover uses `transition-all duration-200 ease-out`
    - Verify max transition duration is 300ms
    - Standardize Framer Motion entrance animations to `{ opacity: 0, y: 12 }` → `{ opacity: 1, y: 0 }` with `duration: 0.35, ease: "easeOut"`
    - Verify `@media (prefers-reduced-motion: reduce)` disables non-essential animations
    - Verify Framer Motion components respect `useReducedMotion()`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 9.2 Write property test for transition timing constraints
    - **Property 5: Transition timing constraints**
    - Validate duration is between 150ms–300ms, timing function is ease-out or ease-in-out
    - Validate Framer Motion animations limited to opacity + translateY, duration ≤ 400ms
    - **Validates: Requirements 12.1, 12.2, 12.4**

- [x] 10. Responsive behavior verification
  - [x] 10.1 Verify and fix responsive adaptations across all components
    - Confirm neutral palette and accent color consistent across all viewports
    - Confirm Homepage section spacing reduces to ≥32px on mobile (below 640px)
    - Confirm ProductCard renders full-width single-column on mobile (below 640px)
    - Confirm Header collapses to mobile menu below 768px with white bg and border
    - Confirm Footer stacks columns vertically on mobile with maintained spacing
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- This is a purely visual refresh — no data model, API, or business logic changes
- All component prop signatures and TypeScript interfaces remain unchanged

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "1.4", "2.1", "3.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "4.2", "4.3", "6.1", "6.2", "7.1", "7.2", "8.1", "8.2"] },
    { "id": 4, "tasks": ["6.3", "7.3", "8.3", "9.1", "10.1"] },
    { "id": 5, "tasks": ["9.2"] }
  ]
}
```
