# Requirements Document

## Introduction

This feature converts the existing multi-payment e-commerce checkout into a WhatsApp-only ordering flow. Customers browse products and add to cart without needing to log in. At checkout, they fill in delivery details and are redirected to WhatsApp with a pre-formatted message containing all order and customer information. All payment gateways (Razorpay, COD backend processing) are removed. Admin authentication and admin panel functionality remain unchanged.

## Glossary

- **Storefront**: The customer-facing portion of the application (product browsing, cart, checkout)
- **Admin_Panel**: The store management interface at `/admin/*` routes, accessible only to admin users
- **Checkout_Page**: The page at `/checkout` where customers enter delivery details and initiate a WhatsApp order
- **Checkout_Form**: The form on the Checkout_Page that collects customer delivery information
- **WhatsApp_Message_Builder**: The utility that constructs a formatted order message containing customer details and cart items
- **Cart**: The client-side shopping cart stored in localStorage, managed by CartContext
- **Customer_Auth_Pages**: The pages at `/auth/*` (login, sign-up, forgot-password, update-password) used for customer authentication
- **Account_Pages**: The pages at `/account/*` (orders, addresses, wishlist, reviews) that require customer login
- **Admin_Auth**: The authentication flow at `/admin/login` using Supabase `app_metadata.role = "admin"` to restrict access to the Admin_Panel
- **Store_Phone**: The WhatsApp phone number stored in `site_settings.whatsapp` used as the message recipient

## Requirements

### Requirement 1: Remove Customer Authentication Flows

**User Story:** As a customer, I want to browse and purchase products without creating an account or logging in, so that ordering is frictionless.

#### Acceptance Criteria

1. THE Storefront SHALL allow all visitors to browse products, view product details, add items to Cart, and access the Checkout_Page without authentication
2. WHEN a visitor navigates to any Customer_Auth_Pages route (`/auth/login`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/update-password`), THE Storefront SHALL redirect the visitor to the homepage with HTTP 307 temporary redirect
3. WHEN a visitor navigates to any Account_Pages route (`/account`, `/account/orders`, `/account/addresses`, `/account/wishlist`, `/account/reviews`), THE Storefront SHALL redirect the visitor to the homepage with HTTP 307 temporary redirect
4. THE Storefront SHALL remove all customer login, sign-up, and account-related links and buttons from the Header component, Footer component, and MobileBottomNav component
5. THE Admin_Auth SHALL continue to function at `/admin/login` using `app_metadata.role = "admin"` validation without any modifications
6. THE Storefront SHALL remove the `HeaderAuth` component rendering from the Header since customer login is no longer needed
7. THE MobileBottomNav SHALL replace the "Account" navigation item with a direct link to the Checkout_Page or remove it entirely

### Requirement 2: Remove Payment Gateways

**User Story:** As a store owner, I want to remove Razorpay and all payment gateway processing, so that orders are handled exclusively through WhatsApp communication.

#### Acceptance Criteria

1. THE Checkout_Page SHALL NOT load the Razorpay checkout script (`checkout.razorpay.com`)
2. THE Checkout_Page SHALL NOT display payment method selection options (COD, Razorpay, PhonePe)
3. THE Storefront SHALL remove the API routes at `/api/razorpay/order`, `/api/razorpay/verify`, and `/api/razorpay/webhook` such that those paths no longer resolve to handler code
4. THE Storefront SHALL remove the order creation API route at `/api/orders/create` since orders are no longer processed server-side
5. WHEN a visitor attempts to access any of the removed API routes (`/api/razorpay/order`, `/api/razorpay/verify`, `/api/razorpay/webhook`, `/api/orders/create`) directly, THE Storefront SHALL return HTTP 404 with a JSON body containing an error message indicating the route does not exist
6. THE Storefront SHALL remove the Razorpay environment variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) from the `.env.example` file and not require them at runtime
7. WHILE the admin views orders that were previously placed via Razorpay, THE Storefront SHALL continue to display their stored payment method and payment status without errors
8. THE Checkout_Page SHALL display only the WhatsApp-based order submission flow as the sole method for placing orders, with no payment gateway UI elements rendered

### Requirement 3: WhatsApp-Only Checkout Form

**User Story:** As a customer, I want to fill in my delivery details on the checkout page, so that the store receives all information needed to fulfill my order.

#### Acceptance Criteria

1. THE Checkout_Form SHALL collect the following required fields: full name (maximum 100 characters), phone number (10-digit Indian mobile number), and address line (maximum 250 characters)
2. THE Checkout_Form SHALL collect the following optional fields: email (valid email format), alternate phone number (10-digit Indian mobile number), city, state, pincode (6-digit numeric), and landmark
3. THE Checkout_Form SHALL display a cart summary showing each item name, quantity, unit price, and line total
4. THE Checkout_Form SHALL display the order subtotal, any applied discount, and the final total amount
5. IF any required field (name, phone, address line) is empty or contains only whitespace, THEN THE Checkout_Page SHALL disable the WhatsApp order button and display a validation message indicating which fields are missing
6. THE Checkout_Form SHALL retain the promo code / coupon application functionality so customers can see their discount reflected in the final total
7. IF the cart contains zero items, THEN THE Checkout_Page SHALL disable the WhatsApp order button
8. IF the store WhatsApp phone number is not configured, THEN THE Checkout_Page SHALL disable the WhatsApp order button

### Requirement 4: WhatsApp Order Message Construction

**User Story:** As a store owner, I want the WhatsApp message to contain all customer and order details, so that I can process the order without needing additional information.

#### Acceptance Criteria

1. THE WhatsApp_Message_Builder SHALL include the customer full name, phone number, and full delivery address (address line, city, state, 6-digit pincode, landmark) in a "Customer Details" section of the message
2. THE WhatsApp_Message_Builder SHALL include each cart item as a separate line containing the product name, quantity, unit sell price formatted in INR with ₹ symbol, and line total (quantity × unit sell price) formatted in INR with ₹ symbol
3. IF a discount has been applied, THEN THE WhatsApp_Message_Builder SHALL include the order subtotal, discount amount, and final payable total in an "Order Total" section of the message
4. IF no discount has been applied, THEN THE WhatsApp_Message_Builder SHALL include only the order subtotal as the final payable total in the "Order Total" section of the message
5. WHEN the customer email field contains a value, THE WhatsApp_Message_Builder SHALL include the customer email in the "Customer Details" section of the message
6. WHEN the alternate phone number field contains a value, THE WhatsApp_Message_Builder SHALL include the alternate phone number in the "Customer Details" section of the message
7. THE WhatsApp_Message_Builder SHALL format the message with labeled section headers ("Customer Details", "Order Items", "Order Total") each separated by a blank line, with one item per line in the Order Items section
8. IF the landmark field is empty, THEN THE WhatsApp_Message_Builder SHALL omit the landmark from the delivery address without leaving a blank placeholder

### Requirement 5: WhatsApp Redirect on Order Submission

**User Story:** As a customer, I want to be redirected to WhatsApp with a pre-filled order message after filling my details, so that I can place my order with one click.

#### Acceptance Criteria

1. WHEN the customer clicks the "Order on WhatsApp" button on the Checkout_Page and the cart contains at least one item, THE Storefront SHALL open a WhatsApp URL (`https://wa.me/{Store_Phone}?text={encoded_message}`) in a new browser tab or the device WhatsApp application, where `{encoded_message}` is a URL-encoded string containing each cart item name, quantity, and line total, followed by the overall order total
2. THE Storefront SHALL use the Store_Phone number from `site_settings.whatsapp`, normalized to 12-digit Indian format (91XXXXXXXXXX), as the WhatsApp recipient
3. IF the Store_Phone is not configured in site settings (null, empty, or invalid format), THEN THE Checkout_Page SHALL disable the "Order on WhatsApp" button and display a message indicating that WhatsApp ordering is unavailable
4. WHEN the WhatsApp URL is successfully opened, THE Storefront SHALL clear all items from the cart in localStorage within 1 second of the redirect
5. WHILE the cart is empty, THE Checkout_Page SHALL disable the "Order on WhatsApp" button to prevent submission of an empty order

### Requirement 6: Preserve Admin Panel Functionality

**User Story:** As a store admin, I want the admin panel to remain fully functional with its existing authentication, so that I can continue managing the store.

#### Acceptance Criteria

1. THE Admin_Panel at `/admin/*` routes SHALL remain accessible and render all existing admin pages (orders, products, categories, subcategories, banners, coupons, site settings, SEO, billing, homepage, reviews) without errors
2. WHEN a user submits valid admin credentials at `/admin/login`, THE Admin_Auth SHALL authenticate via Supabase, verify `app_metadata.role = "admin"`, and redirect the user to `/admin`
3. IF the user at `/admin/login` provides invalid credentials or the account does not have `app_metadata.role = "admin"`, THEN THE Admin_Auth SHALL reject the login attempt and display an error message indicating the reason for failure without granting access to admin routes
4. IF a user navigates to any `/admin/*` route without a valid authenticated session, THEN THE Admin_Panel SHALL redirect the user to `/admin/login`
5. THE Admin_Panel order management page at `/admin/orders` SHALL display orders from the database ordered by creation date descending
6. WHEN the admin updates the Store_Phone (WhatsApp number) on the site settings page at `/admin/site` and submits the form, THE Admin_Panel SHALL persist the updated value to the database
