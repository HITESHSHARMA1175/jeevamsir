# Implementation Plan: WhatsApp-Only Checkout

## Overview

This plan converts the existing multi-payment checkout into a WhatsApp-only ordering flow. Implementation proceeds in phases: first removing deprecated routes and auth flows, then building the new checkout form and message builder, and finally wiring everything together. The admin panel is preserved throughout.

## Tasks

- [x] 1. Remove customer authentication and account flows
  - [x] 1.1 Create redirect pages for auth routes
    - Replace content in `app/auth/login/page.tsx`, `app/auth/sign-up/page.tsx`, `app/auth/forgot-password/page.tsx`, `app/auth/update-password/page.tsx` with a server component that calls `redirect("/")` from `next/navigation`
    - Create a catch-all `app/auth/[...path]/page.tsx` that redirects to `/` to handle any other auth paths
    - _Requirements: 1.2_

  - [x] 1.2 Create redirect pages for account routes
    - Replace content in `app/account/page.tsx`, `app/account/orders/page.tsx`, `app/account/addresses/page.tsx`, `app/account/wishlist/page.tsx`, `app/account/reviews/page.tsx` with a server component that calls `redirect("/")`
    - Create a catch-all `app/account/[...path]/page.tsx` that redirects to `/` to handle any other account paths
    - _Requirements: 1.3_

  - [x] 1.3 Remove customer auth UI from Header, Footer, and MobileBottomNav
    - In `components/store/Header.tsx`, remove the `<HeaderAuth />` component rendering
    - In `components/store/Footer.tsx`, remove "My account", "Track order", "Wishlist" links
    - In `components/store/MobileBottomNav.tsx`, replace the "Account" navigation item with a link to `/checkout`
    - _Requirements: 1.4, 1.6, 1.7_

- [x] 2. Remove payment gateway routes and references
  - [x] 2.1 Delete Razorpay API routes
    - Delete `app/api/razorpay/order/route.ts`
    - Delete `app/api/razorpay/verify/route.ts`
    - Delete `app/api/razorpay/webhook/route.ts`
    - Verify these paths return 404 after deletion (Next.js default behavior for missing routes)
    - _Requirements: 2.3, 2.5_

  - [x] 2.2 Delete order creation API route
    - Delete `app/api/orders/create/route.ts`
    - Verify the path returns 404 after deletion
    - _Requirements: 2.4, 2.5_

  - [x] 2.3 Remove Razorpay environment variables from `.env.example`
    - Remove `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` entries from `.env.example`
    - _Requirements: 2.6_

- [ ] 3. Checkpoint - Verify removals
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement WhatsApp message builder utility
  - [x] 4.1 Define TypeScript types for WhatsApp order data
    - Create or update `utils/store/whatsapp.ts` with `WhatsAppOrderData` and `FormValidation` types
    - Define `CheckoutFormState` type
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ] 4.2 Implement `buildWhatsAppOrderMessage` pure function
    - Implement the function in `utils/store/whatsapp.ts`
    - Format "Customer Details" section with name, phone, addressLine, and conditionally include email, alternatePhone, city, state, pincode, landmark (omit if empty)
    - Format "Order Items" section with one line per item: name, quantity, unit price (₹), line total (₹)
    - Format "Order Total" section: include subtotal, discount (only if > 0), and final total with ₹ symbol
    - Separate sections with blank lines and labeled headers
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 4.3 Write property test for form field validation (Property 1)
    - **Property 1: Form field validation correctly accepts and rejects inputs**
    - Use fast-check to generate random strings and verify required field validation (empty/whitespace/over-length rejects) and optional field format validation (invalid format rejects, empty accepts)
    - **Validates: Requirements 3.1, 3.2, 3.5**

  - [ ]* 4.4 Write property test for Customer Details completeness (Property 4)
    - **Property 4: WhatsApp message Customer Details section completeness**
    - Use fast-check to generate random customer objects with varying optional fields, verify message includes all non-empty fields and excludes empty ones
    - **Validates: Requirements 4.1, 4.5, 4.6, 4.8**

  - [ ]* 4.5 Write property test for Order Items formatting (Property 5)
    - **Property 5: WhatsApp message Order Items formatting**
    - Use fast-check to generate random CartItem arrays, verify each item appears as a correctly formatted line
    - **Validates: Requirements 4.2**

  - [ ]* 4.6 Write property test for Order Total correctness (Property 6)
    - **Property 6: WhatsApp message Order Total correctness**
    - Use fast-check to generate random subtotal/discount combinations, verify correct section content with/without discount
    - **Validates: Requirements 4.3, 4.4**

  - [ ]* 4.7 Write property test for message structure (Property 7)
    - **Property 7: WhatsApp message structure and formatting**
    - Use fast-check to generate random valid order data, verify exactly three section headers separated by blank lines and correct item count
    - **Validates: Requirements 4.7**

- [ ] 5. Implement form validation and WhatsApp URL construction
  - [ ] 5.1 Implement checkout form validation function
    - Create `validateCheckoutForm(state: CheckoutFormState): FormValidation` in `utils/store/whatsapp.ts`
    - Validate name (non-empty, non-whitespace, max 100), phone (10 digits), addressLine (non-empty, non-whitespace, max 250)
    - Validate optional fields: email (valid format if provided), alternatePhone (10 digits if provided), pincode (6 digits if provided)
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 5.2 Implement `buildWhatsAppUrl` function
    - Create function in `utils/store/whatsapp.ts` that takes store phone and message string
    - Normalize phone to 12-digit Indian format (91XXXXXXXXXX) using existing `normalizeWhatsAppPhone` utility
    - Construct URL: `https://wa.me/{normalizedPhone}?text={encodeURIComponent(message)}`
    - _Requirements: 5.1, 5.2_

  - [ ]* 5.3 Write property test for URL construction (Property 8)
    - **Property 8: WhatsApp URL construction with phone normalization**
    - Use fast-check to generate random valid Indian phone numbers (10/11/12 digit formats) and random message strings, verify URL format and encoding
    - **Validates: Requirements 5.1, 5.2**

- [ ] 6. Checkpoint - Verify utility functions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Build WhatsApp checkout page
  - [ ] 7.1 Rewrite checkout page component
    - Rewrite `app/checkout/page.tsx` to remove all Razorpay and COD logic
    - Build checkout form with fields: name (required), phone (required), addressLine (required), email, alternatePhone, city, state, pincode, landmark
    - Display inline validation errors below each field
    - Disable "Order on WhatsApp" button when form is invalid, cart is empty, or store phone is not configured
    - _Requirements: 2.1, 2.2, 2.8, 3.1, 3.2, 3.5, 3.7, 3.8_

  - [ ] 7.2 Implement cart summary display in checkout
    - Show each cart item name, quantity, unit price (₹), and line total (₹)
    - Display subtotal, applied discount (if any), and final total
    - Preserve coupon/promo code application functionality (use existing `/api/coupons/apply` endpoint)
    - _Requirements: 3.3, 3.4, 3.6_

  - [ ] 7.3 Implement WhatsApp redirect and cart clear on submission
    - On "Order on WhatsApp" button click: call `buildWhatsAppOrderMessage`, then `buildWhatsAppUrl`
    - Open the WhatsApp URL via `window.open` in a new tab
    - Clear cart from localStorage via CartContext after URL opens
    - _Requirements: 5.1, 5.4, 5.5_

  - [ ]* 7.4 Write property test for cart summary rendering (Property 2)
    - **Property 2: Cart summary rendering contains all item information**
    - Use fast-check to generate random CartItem arrays and verify rendered output includes all required fields per item
    - **Validates: Requirements 3.3**

  - [ ]* 7.5 Write property test for order total computation (Property 3)
    - **Property 3: Order total computation is correct**
    - Use fast-check to generate random subtotal/discount pairs, verify `total === subtotal - discount`
    - **Validates: Requirements 3.4**

- [ ] 8. Verify admin panel preservation
  - [ ] 8.1 Verify admin routes and auth remain functional
    - Confirm `app/admin/*` pages render without errors
    - Confirm `app/(public-admin)/admin/login/page.tsx` is unchanged and functional
    - Confirm admin middleware redirects unauthenticated users to `/admin/login`
    - Confirm historical orders with Razorpay payment method display correctly in `/admin/orders`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7 (from Req 2)_

  - [ ] 8.2 Verify site settings WhatsApp phone persistence
    - Confirm admin can update `site_settings.whatsapp` from `/admin/site` page
    - Confirm the updated phone number is used by the checkout page
    - _Requirements: 6.6_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The admin panel is explicitly verified but not modified
- TypeScript is used for all implementation (matching the existing Next.js/TypeScript codebase)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1", "2.2", "2.3"] },
    { "id": 1, "tasks": ["1.3", "4.1"] },
    { "id": 2, "tasks": ["4.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "4.5", "4.6", "4.7", "5.3"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3"] },
    { "id": 6, "tasks": ["7.4", "7.5", "8.1", "8.2"] }
  ]
}
```
