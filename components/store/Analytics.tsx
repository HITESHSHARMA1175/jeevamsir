// ============================================
// FILE: components/store/Analytics.tsx
// PURPOSE: Conditionally load Google Analytics
// USED IN: app/layout.tsx
// INTERN NOTE: Set GA ID in `site_settings.ga_id` (Supabase).
// ============================================

import Script from "next/script";

type Props = { gaId: string | null };

/**
 * Analytics
 * Loads Google Analytics only when gaId is set.
 */
export default function Analytics({ gaId }: Props) {
  const id = gaId?.trim();
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}

Analytics.displayName = "Analytics";

