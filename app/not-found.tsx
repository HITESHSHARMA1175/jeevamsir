// ============================================
// FILE: app/not-found.tsx
// PURPOSE: Friendly 404 page
// USED IN: Next.js notFound() handling
// INTERN NOTE: Customize the message/branding here.
// ============================================

import Link from "next/link";
import { Button } from "@/components/ui/button";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import { getSiteSettings } from "@/utils/store/queries";

export default async function NotFound() {
  const settings = await getSiteSettings();
  const phone = settings?.whatsapp ?? "7705074250";

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-16 text-center">
      <div className="space-y-4">
        <div className="text-6xl font-bold">404</div>
        <div className="text-lg font-semibold">Page not found</div>
        <div className="text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or was moved.
        </div>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/category/electronics`}>Browse products</Link>
          </Button>
        </div>
      </div>
      <WhatsAppButton phone={phone} />
    </main>
  );
}

