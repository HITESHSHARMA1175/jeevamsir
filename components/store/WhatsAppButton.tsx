"use client";

// ============================================
// FILE: components/store/WhatsAppButton.tsx
// PURPOSE: Floating WhatsApp CTA for support or product inquiry
// USED IN: Homepage and product page
// INTERN NOTE: Edit default message text in utils/store/whatsapp.ts
// ============================================

import Link from "next/link";
import { buildProductInquiryMessage, buildWhatsAppUrl } from "@/utils/store/whatsapp";

type Props = {
  phone: string;
  productName?: string;
  productUrl?: string;
  sellPrice?: number;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.11 17.205c-.277-.138-1.637-.807-1.89-.9-.252-.092-.436-.138-.62.138-.185.277-.713.9-.874 1.085-.16.184-.32.208-.598.07-.277-.138-1.17-.431-2.23-1.376-.824-.734-1.38-1.64-1.543-1.917-.16-.277-.017-.427.122-.565.125-.125.277-.32.416-.48.138-.16.184-.277.277-.462.092-.185.046-.347-.023-.485-.07-.138-.62-1.494-.85-2.046-.223-.536-.45-.463-.62-.47l-.53-.01c-.184 0-.485.07-.74.347-.254.277-.97.947-.97 2.31 0 1.362.994 2.677 1.132 2.862.138.185 1.956 2.987 4.736 4.19.662.286 1.18.457 1.584.585.665.212 1.27.182 1.747.11.533-.08 1.637-.67 1.87-1.316.23-.646.23-1.2.16-1.316-.07-.115-.253-.184-.53-.323z" />
      <path d="M16.02 3.2c-7.067 0-12.81 5.74-12.81 12.806 0 2.26.59 4.47 1.71 6.42L3.2 28.8l6.54-1.7a12.77 12.77 0 0 0 6.28 1.6h.005c7.067 0 12.81-5.74 12.81-12.806S23.09 3.2 16.02 3.2zm0 23.01h-.004a10.63 10.63 0 0 1-5.42-1.49l-.39-.23-3.88 1.01 1.03-3.78-.25-.39a10.61 10.61 0 0 1-1.62-5.64c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.57 10.57 0 0 1 3.12 7.52c0 5.87-4.78 10.65-10.65 10.65z" />
    </svg>
  );
}

/**
 * WhatsAppButton
 * Floating button that opens WhatsApp chat in a new tab.
 */
export default function WhatsAppButton({
  phone,
  productName,
  productUrl,
  sellPrice,
}: Props) {
  const message =
    productName && productUrl && typeof sellPrice === "number"
      ? buildProductInquiryMessage(productName, sellPrice, productUrl)
      : "Hi! I'd like to know more about your products.";

  const href = buildWhatsAppUrl(phone, message);

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-24 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white shadow-[var(--shadow-soft)] transition-transform duration-150 ease-out hover:scale-105 active:scale-95 md:bottom-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </Link>
  );
}

WhatsAppButton.displayName = "WhatsAppButton";

