# Requirements Document

## Introduction

A comprehensive visual refresh of the Jeewanom Ayurveda e-commerce storefront, transitioning from the current warm amber/green earthy aesthetic to a minimal, clean luxury look. The refresh establishes a neutral palette (whites, soft grays) with a single deep green/teal accent color, generous whitespace, and a hybrid shape language (rounded buttons/pills, squared-off cards/containers). The goal is to evoke a high-end wellness brand while preserving all existing functionality and accessibility.

## Glossary

- **Theme_System**: The set of CSS custom properties (variables) defined in `globals.css` that control colors, typography, spacing, shadows, and border-radius values across the storefront.
- **Header**: The top navigation bar component (`Header.tsx`) containing the logo, navigation links, search, account dropdown, and cart button.
- **MobileBottomNav**: The fixed bottom navigation bar (`MobileBottomNav.tsx`) displayed on mobile viewports for primary navigation actions.
- **Homepage**: The main landing page composed of Carousel, CategoryRow, BannerSection, MiddleBannerSection, and product grid sections.
- **ProductCard**: The reusable card component (`ProductCard.tsx`) displaying product image, name, price, and add-to-cart action in grids and carousels.
- **ProductDetailPage**: The full product detail view including ImageGallery, product information, options picker, reviews, and add-to-cart functionality.
- **CartSheet**: The slide-out drawer (`CartSheet.tsx`) displaying cart items, quantities, subtotal, and checkout action.
- **CheckoutForm**: The checkout page form component handling shipping details, payment selection, and order placement.
- **Footer**: The bottom section (`Footer.tsx`) containing site links, contact information, and legal/copyright text.
- **WhatsAppButton**: The floating action button (`WhatsAppButton.tsx`) providing direct WhatsApp contact access.
- **Accent_Color**: The single deep green or teal color (approximately HSL 170-175, 40-50% saturation, 30-40% lightness) used for primary interactive elements, CTAs, and brand emphasis.
- **Neutral_Palette**: The base color scheme consisting of pure white, off-white, and soft gray tones used for backgrounds, cards, and surfaces.
- **Hybrid_Shape_Language**: The design principle where interactive elements (buttons, badges, pills) use fully rounded corners while structural containers (cards, sections, panels) use sharp or slightly rounded corners (2-4px radius).

## Requirements

### Requirement 1: Global Theme Variables

**User Story:** As a storefront visitor, I want a cohesive minimal luxury visual identity, so that the brand feels premium and trustworthy.

#### Acceptance Criteria

1. THE Theme_System SHALL define the `--background` variable as a neutral white or off-white tone (hue 0-60, saturation below 5%, lightness above 96%).
2. THE Theme_System SHALL define the `--primary` variable as a deep green or teal tone (hue between 160 and 180, saturation between 30% and 55%, lightness between 25% and 42%).
3. THE Theme_System SHALL define the `--foreground` variable as a near-black neutral tone (lightness below 12%) for primary text.
4. THE Theme_System SHALL define the `--muted-foreground` variable as a medium gray tone (lightness between 40% and 55%) for secondary text.
5. THE Theme_System SHALL define the `--card` variable as pure white (HSL 0 0% 100%).
6. THE Theme_System SHALL define the `--border` variable as a soft gray tone (saturation below 8%, lightness between 88% and 94%).
7. THE Theme_System SHALL define `--brand-primary` as a hex value corresponding to the deep green/teal Accent_Color.
8. THE Theme_System SHALL define `--radius` as 0.375rem (6px) for card and container border-radius.
9. THE Theme_System SHALL remove gradient backgrounds from the `body` element and apply a flat Neutral_Palette background.
10. THE Theme_System SHALL define `--shadow-soft` and `--shadow-card` using neutral gray rgba values (no amber or earth-toned tints).

### Requirement 2: Typography

**User Story:** As a storefront visitor, I want clean, legible typography with clear hierarchy, so that I can scan content quickly and comfortably.

#### Acceptance Criteria

1. THE Theme_System SHALL use a sans-serif font stack (system font or Inter/equivalent) as the primary body typeface.
2. THE Theme_System SHALL define `--text-hero` with a clamp range producing sizes between 2rem and 3.5rem.
3. THE Theme_System SHALL define heading font-weight as 600 (semi-bold) for primary headings.
4. THE Theme_System SHALL set body text line-height to a value between 1.5 and 1.7 for readability.
5. THE Theme_System SHALL maintain a minimum contrast ratio of 4.5:1 between foreground text and background colors for WCAG AA compliance.

### Requirement 3: Header and Navigation

**User Story:** As a storefront visitor, I want a clean, uncluttered header, so that I can navigate the site without visual distraction.

#### Acceptance Criteria

1. THE Header SHALL render with a white or off-white solid background without gradient effects.
2. THE Header SHALL display a subtle bottom border using the `--border` color for separation from page content.
3. THE Header SHALL use the Accent_Color exclusively for active navigation states and hover indicators.
4. WHEN a user hovers over a navigation link, THE Header SHALL transition the link color to the Accent_Color within 150ms.
5. THE Header SHALL maintain a minimum height of 64px on desktop viewports and 56px on mobile viewports.
6. THE Header SHALL display navigation text in medium weight (500) with no uppercase transforms.

### Requirement 4: Homepage Sections

**User Story:** As a storefront visitor, I want clearly separated, card-based homepage sections, so that I can scan and discover products and categories easily.

#### Acceptance Criteria

1. THE Homepage SHALL render each content section (Carousel, CategoryRow, BannerSection, product grid) with vertical spacing of at least 48px between sections.
2. THE Homepage SHALL render section containers with squared-off corners (border-radius no greater than 4px) following the Hybrid_Shape_Language.
3. THE Homepage SHALL display product grids and category rows against a flat white or off-white background without gradient overlays.
4. THE Homepage SHALL render the Carousel with edge-to-edge images and minimal overlay text using white or light semi-transparent backgrounds.
5. THE Homepage SHALL use the Accent_Color for section heading decorative elements and CTA buttons only.
6. WHEN the CategoryRow displays category items, THE Homepage SHALL render each category item with generous padding (at least 16px) and centered alignment.

### Requirement 5: Product Cards

**User Story:** As a storefront visitor, I want clean, structured product cards, so that I can evaluate products at a glance.

#### Acceptance Criteria

1. THE ProductCard SHALL render with a squared-off container shape (border-radius no greater than 4px) following the Hybrid_Shape_Language.
2. THE ProductCard SHALL display a white background with a 1px solid border using the `--border` color.
3. THE ProductCard SHALL render the add-to-cart button with fully rounded corners (border-radius 9999px) following the Hybrid_Shape_Language.
4. THE ProductCard SHALL display product images with no border-radius or maximum 2px border-radius.
5. THE ProductCard SHALL apply a neutral box-shadow on hover using `--shadow-soft` values.
6. THE ProductCard SHALL maintain at least 12px internal padding around text content.
7. THE ProductCard SHALL display the product price in the Accent_Color when showing the current/sale price.

### Requirement 6: Product Detail Page

**User Story:** As a storefront visitor, I want a spacious, well-organized product detail page, so that I can make informed purchase decisions.

#### Acceptance Criteria

1. THE ProductDetailPage SHALL render the image gallery against a neutral light gray background (lightness between 96% and 98%).
2. THE ProductDetailPage SHALL separate the image section and product information section with at least 32px of horizontal spacing on desktop.
3. THE ProductDetailPage SHALL render the primary "Add to Cart" button with fully rounded corners and the Accent_Color as background.
4. THE ProductDetailPage SHALL display product options (size, variant) using pill-shaped selectors with rounded borders.
5. WHEN a product option is selected, THE ProductDetailPage SHALL indicate the selected state using the Accent_Color border and a light tinted background.
6. THE ProductDetailPage SHALL render product description and details sections with clear vertical separation (at least 24px) and subtle divider lines.

### Requirement 7: Cart Sheet (Drawer)

**User Story:** As a storefront visitor, I want a clean, focused cart drawer, so that I can review my selections without clutter.

#### Acceptance Criteria

1. THE CartSheet SHALL render with a pure white background and no gradient or tinted overlays.
2. THE CartSheet SHALL display each cart item row with a subtle bottom border using the `--border` color for separation.
3. THE CartSheet SHALL render the checkout CTA button with fully rounded corners and the Accent_Color as background.
4. THE CartSheet SHALL apply a neutral dark overlay (rgba black, opacity between 0.3 and 0.5) on the background page when open.
5. THE CartSheet SHALL use at least 20px padding on all internal edges for generous whitespace.

### Requirement 8: Checkout Page

**User Story:** As a storefront visitor, I want a distraction-free checkout experience, so that I can complete my purchase confidently.

#### Acceptance Criteria

1. THE CheckoutForm SHALL render on a neutral white or off-white background without decorative gradients.
2. THE CheckoutForm SHALL group form sections (shipping, payment, summary) in squared-off card containers with 1px borders following the Hybrid_Shape_Language.
3. THE CheckoutForm SHALL render input fields with squared-off corners (border-radius no greater than 6px) and a light gray border.
4. THE CheckoutForm SHALL render the primary submit button with fully rounded corners and the Accent_Color as background.
5. THE CheckoutForm SHALL maintain at least 24px spacing between form groups for visual separation.
6. WHEN a form field receives focus, THE CheckoutForm SHALL display a ring indicator using the Accent_Color at reduced opacity.

### Requirement 9: Footer

**User Story:** As a storefront visitor, I want a clean, well-organized footer, so that I can find secondary information and links without strain.

#### Acceptance Criteria

1. THE Footer SHALL render with a near-white or very light gray background (lightness above 95%) distinct from the main content area.
2. THE Footer SHALL organize links into clearly labeled column groups with heading text in semi-bold weight.
3. THE Footer SHALL use the `--muted-foreground` color for link text and the Accent_Color for link hover states.
4. THE Footer SHALL display a top border using the `--border` color to separate from main content.
5. THE Footer SHALL maintain at least 48px vertical padding for generous internal spacing.

### Requirement 10: WhatsApp Floating Button

**User Story:** As a storefront visitor, I want the WhatsApp contact button to fit the refined visual style, so that the interface feels cohesive.

#### Acceptance Criteria

1. THE WhatsAppButton SHALL render as a circular button (border-radius 9999px) with the WhatsApp brand green color.
2. THE WhatsAppButton SHALL display a subtle neutral shadow (`--shadow-soft`) rather than a colored or glowing shadow.
3. THE WhatsAppButton SHALL position fixed at the bottom-right of the viewport with at least 20px offset from screen edges.
4. WHEN the MobileBottomNav is visible, THE WhatsAppButton SHALL position above the MobileBottomNav with at least 12px clearance to prevent overlap.
5. THE WhatsAppButton SHALL render at a size between 48px and 56px diameter for accessible tap targets.

### Requirement 11: Mobile Bottom Navigation

**User Story:** As a mobile storefront visitor, I want a clean bottom navigation bar, so that I can access primary actions without visual clutter.

#### Acceptance Criteria

1. THE MobileBottomNav SHALL render with a white background and a subtle top border using the `--border` color.
2. THE MobileBottomNav SHALL display the active tab icon and label in the Accent_Color.
3. THE MobileBottomNav SHALL display inactive tab icons and labels in the `--muted-foreground` color.
4. THE MobileBottomNav SHALL maintain a minimum height of 56px for accessible interaction targets.
5. THE MobileBottomNav SHALL apply a subtle upward shadow for visual elevation above page content.

### Requirement 12: Motion and Transitions

**User Story:** As a storefront visitor, I want smooth, subtle animations, so that interactions feel polished without being distracting.

#### Acceptance Criteria

1. THE Theme_System SHALL define transition durations between 150ms and 300ms for interactive state changes (hover, focus, active).
2. THE Theme_System SHALL use ease-out or ease-in-out timing functions for element transitions.
3. WHEN the user has enabled prefers-reduced-motion, THE Theme_System SHALL disable all non-essential animations and transitions.
4. THE Theme_System SHALL limit Framer Motion entrance animations to opacity and translateY transforms with durations no greater than 400ms.

### Requirement 13: Responsive Behavior

**User Story:** As a storefront visitor on any device, I want the refreshed design to adapt fluidly, so that the luxury feel is maintained across screen sizes.

#### Acceptance Criteria

1. THE Theme_System SHALL maintain the Neutral_Palette and Accent_Color consistently across all viewport widths.
2. THE Homepage SHALL reduce section vertical spacing to at least 32px on mobile viewports (below 640px).
3. THE ProductCard SHALL render at full container width in single-column layout on mobile viewports (below 640px).
4. THE Header SHALL collapse navigation into a mobile menu on viewports below 768px while maintaining the white background and border styling.
5. THE Footer SHALL stack link columns vertically on mobile viewports (below 640px) while maintaining padding and spacing proportions.
