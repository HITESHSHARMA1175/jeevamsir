// ============================================
// FILE: app/account/addresses/page.tsx
// PURPOSE: Customer's saved address (stored in auth.user_metadata).
// USED IN: /account/addresses
// ============================================

import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import AccountProfileForm from "@/components/store/AccountProfileForm";
import { createClient } from "@/lib/supabase/server";
import {
  getBrandSettings,
  getCategories,
  getSiteSettings,
  getSubcategories,
} from "@/utils/store/queries";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const [settings, categories, subcategories, brand] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getSubcategories(),
    getBrandSettings(),
  ]);

  const safeSettings = settings ?? {
    id: "missing",
    site_name: "Ayurveda Store",
    logo_url: null,
    meta_title: "Ayurveda Store",
    meta_desc: "Discover authentic Ayurveda essentials.",
    og_image: null,
    ga_id: null,
    whatsapp: "7705074250",
    created_at: null,
    updated_at: null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (error || !user) redirect("/auth/login?next=/account/addresses");

  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const initialFullName =
    typeof userMeta?.full_name === "string" ? userMeta.full_name : "";
  const initialPhone =
    typeof userMeta?.phone === "string" ? userMeta.phone : "";
  const initialAddress =
    typeof userMeta?.address === "string" ? userMeta.address : "";

  return (
    <>
      <Header
        settings={safeSettings}
        categories={categories}
        subcategories={subcategories}
      />
      <main className="container-pad section-pad space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[var(--text-heading)] font-semibold tracking-tight">
              Addresses
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              Save your default delivery address for faster checkout.
            </div>
          </div>
          <Link
            href="/account"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to account
          </Link>
        </div>

        <div className="max-w-2xl rounded-2xl border bg-card p-5 shadow-sm">
          <AccountProfileForm
            initialFullName={initialFullName}
            initialPhone={initialPhone}
            initialAddress={initialAddress}
          />
        </div>
      </main>
      <Footer settings={safeSettings} brand={brand} />
    </>
  );
}
