// ============================================
// FILE: app/checkout/page.tsx
// PURPOSE: WhatsApp-only checkout page — server wrapper that fetches store phone
// USED IN: Cart → checkout
// ============================================

import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  let storePhone: string | null = null;

  try {
    // Use service role to bypass RLS — site_settings is public data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey || anonKey);

    const { data } = await supabase
      .from("site_settings")
      .select("whatsapp")
      .limit(1)
      .maybeSingle();
    storePhone = typeof data?.whatsapp === "string" ? data.whatsapp.trim() : null;
  } catch {
    storePhone = null;
  }

  return <CheckoutForm storePhone={storePhone} />;
}
