// ============================================
// FILE: utils/store/whatsapp.ts
// PURPOSE: WhatsApp URL + message builders
// USED IN: components/store/WhatsAppButton, components/store/CartSheet
// INTERN NOTE: Edit templates here if you want different wording.
// ============================================

import type { CartItem } from "@/types";
import { formatINR } from "@/utils/store/formatPrice";

/**
 * normalizeWhatsAppPhone
 * Normalizes admin/user input to India-ready WhatsApp format.
 *
 * Accepted examples:
 * - "7705074250" -> "917705074250"
 * - "07705074250" -> "917705074250"
 * - "917705074250" -> "917705074250"
 */
export function normalizeWhatsAppPhone(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  const withoutIntlPrefix = digits.startsWith("00") ? digits.slice(2) : digits;

  if (withoutIntlPrefix.length === 10) {
    return `91${withoutIntlPrefix}`;
  }

  if (withoutIntlPrefix.length === 11 && withoutIntlPrefix.startsWith("0")) {
    return `91${withoutIntlPrefix.slice(1)}`;
  }

  if (withoutIntlPrefix.length === 12 && withoutIntlPrefix.startsWith("91")) {
    return withoutIntlPrefix;
  }

  return null;
}

/**
 * buildWhatsAppUrl
 * Builds wa.me URL with URL-encoded message.
 * Normalizes the phone to 12-digit Indian format (91XXXXXXXXXX).
 * Returns empty string if phone normalization fails (invalid/empty phone).
 *
 * @example
 * buildWhatsAppUrl("7705074250", "Hello")
 * // "https://wa.me/917705074250?text=Hello"
 *
 * buildWhatsAppUrl("invalid", "Hello")
 * // ""
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) {
    return "";
  }
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encoded}`;
}

/**
 * buildProductInquiryMessage
 * Pre-filled message for single product inquiry.
 *
 * Template (Hindi-friendly English):
 * "Hi! I want to buy: [name]
 *  Price: [formatted sell price]
 *  Link: [url]
 *  Please confirm availability."
 */
export function buildProductInquiryMessage(
  productName: string,
  sellPrice: number,
  productUrl: string,
): string {
  return [
    `Hi! I want to buy: ${productName}`,
    `Price: ${formatINR(sellPrice)}`,
    `Link: ${productUrl}`,
    "Please confirm availability.",
  ].join("\n");
}

/**
 * buildCartOrderMessage
 * Formats cart as WhatsApp order message.
 *
 * Each item: "• [name] x[qty] — [price]"
 * Footer: "Total: [total]"
 * "Please confirm my order."
 */
export function buildCartOrderMessage(items: CartItem[], total: string): string {
  const lines = items.map(
    (item) =>
      `• ${item.name} x${item.qty} — ${formatINR(item.sell_price * item.qty)}`,
  );
  return [
    "Hi! I want to place an order:",
    "",
    ...lines,
    "",
    `Total: ${total}`,
    "Please confirm my order.",
  ].join("\n");
}

// ============================================
// WhatsApp-Only Checkout Types
// ============================================

/**
 * WhatsAppOrderData
 * Input to the WhatsApp message builder for the checkout flow.
 * Contains all customer delivery details and cart/order information.
 */
export type WhatsAppOrderData = {
  customer: {
    name: string;            // required, max 100 chars
    phone: string;           // required, 10-digit Indian mobile
    email?: string;          // optional, valid email format
    alternatePhone?: string; // optional, 10-digit Indian mobile
    addressLine: string;     // required, max 250 chars
    city?: string;
    state?: string;
    pincode?: string;        // optional, 6-digit numeric
    landmark?: string;
  };
  items: CartItem[];         // from existing CartItem type
  subtotal: number;          // cart total before discount
  discount: number;          // applied discount amount (0 if none)
  total: number;             // final payable = subtotal - discount
};

/**
 * FormValidation
 * Validation result returned by the checkout form validator.
 */
export type FormValidation = {
  isValid: boolean;
  errors: Record<string, string>; // field name → error message
};

/**
 * CheckoutFormState
 * Client-side form state used in the checkout page.
 * All fields are strings; optional fields default to empty string.
 */
export type CheckoutFormState = {
  name: string;
  phone: string;
  addressLine: string;
  email: string;
  alternatePhone: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
};

/**
 * buildWhatsAppOrderMessage
 * Constructs a pre-formatted WhatsApp order message from customer + cart data.
 * Pure function — no side effects.
 *
 * Sections:
 * 1. *Customer Details* — name, phone, address, + optional fields (omitted if empty)
 * 2. *Order Items* — one line per item with name, qty, unit price, line total
 * 3. *Order Total* — subtotal, discount (if > 0), and final total
 */
export function buildWhatsAppOrderMessage(data: WhatsAppOrderData): string {
  const { customer, items, subtotal, discount, total } = data;

  // --- Customer Details section ---
  const customerLines: string[] = [
    `*Customer Details*`,
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
  ];

  if (customer.email) {
    customerLines.push(`Email: ${customer.email}`);
  }
  if (customer.alternatePhone) {
    customerLines.push(`Alt Phone: ${customer.alternatePhone}`);
  }

  customerLines.push(`Address: ${customer.addressLine}`);

  if (customer.city) {
    customerLines.push(`City: ${customer.city}`);
  }
  if (customer.state) {
    customerLines.push(`State: ${customer.state}`);
  }
  if (customer.pincode) {
    customerLines.push(`Pincode: ${customer.pincode}`);
  }
  if (customer.landmark) {
    customerLines.push(`Landmark: ${customer.landmark}`);
  }

  // --- Order Items section ---
  const itemLines: string[] = [`*Order Items*`];
  for (const item of items) {
    const lineTotal = item.sell_price * item.qty;
    itemLines.push(
      `${item.name} × ${item.qty} — ${formatINR(item.sell_price)} = ${formatINR(lineTotal)}`,
    );
  }

  // --- Order Total section ---
  const totalLines: string[] = [`*Order Total*`];
  totalLines.push(`Subtotal: ${formatINR(subtotal)}`);
  if (discount > 0) {
    totalLines.push(`Discount: -${formatINR(discount)}`);
  }
  totalLines.push(`Total: ${formatINR(total)}`);

  // Combine sections separated by blank lines
  return [
    customerLines.join("\n"),
    itemLines.join("\n"),
    totalLines.join("\n"),
  ].join("\n\n");
}


/**
 * validateCheckoutForm
 * Validates all checkout form fields and returns a FormValidation result.
 *
 * Required fields: name, phone, addressLine
 * Optional fields with format validation: email, alternatePhone, pincode
 * No validation: city, state, landmark
 */
export function validateCheckoutForm(state: CheckoutFormState): FormValidation {
  const errors: Record<string, string> = {};

  // --- Required: name ---
  const trimmedName = state.name.trim();
  if (!trimmedName) {
    errors.name = "Name is required";
  } else if (trimmedName.length > 100) {
    errors.name = "Name must be 100 characters or less";
  }

  // --- Required: phone ---
  const trimmedPhone = state.phone.trim();
  if (!trimmedPhone) {
    errors.phone = "Phone number is required";
  } else if (!/^\d{10}$/.test(trimmedPhone)) {
    errors.phone = "Enter a valid 10-digit mobile number";
  }

  // --- Required: addressLine ---
  const trimmedAddress = state.addressLine.trim();
  if (!trimmedAddress) {
    errors.addressLine = "Address is required";
  } else if (trimmedAddress.length > 250) {
    errors.addressLine = "Address must be 250 characters or less";
  }

  // --- Optional: email (validate only if provided) ---
  if (state.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(state.email.trim())) {
      errors.email = "Enter a valid email address";
    }
  }

  // --- Optional: alternatePhone (validate only if provided) ---
  if (state.alternatePhone.trim()) {
    if (!/^\d{10}$/.test(state.alternatePhone.trim())) {
      errors.alternatePhone = "Enter a valid 10-digit mobile number";
    }
  }

  // --- Optional: pincode (validate only if provided) ---
  if (state.pincode.trim()) {
    if (!/^\d{6}$/.test(state.pincode.trim())) {
      errors.pincode = "Enter a valid 6-digit pincode";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
