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
 *
 * @example
 * buildWhatsAppUrl("7705074250", "Hello")
 * // "https://wa.me/7705074250?text=Hello"
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalizedPhone = normalizeWhatsAppPhone(phone) ?? phone.replace(/[^\d]/g, "");
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

