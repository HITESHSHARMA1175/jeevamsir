import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { StoreUserProvider } from "@/context/StoreUserProvider";
import Analytics from "@/components/store/Analytics";
import MobileBottomNav from "@/components/store/MobileBottomNav";
import { getSiteMetadata } from "@/utils/store/seo";
import { getSiteSettings } from "@/utils/store/queries";

export async function generateMetadata() {
  return await getSiteMetadata();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const backgroundImage = settings?.og_image?.trim() || "/ram-ram-background.webp";
  const supabaseOrigin = (() => {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!raw) return null;
    try {
      return new URL(raw).origin;
    } catch {
      return null;
    }
  })();

  const gtmId = settings?.gtm_id?.trim();
  const gscToken = settings?.gsc_verification?.trim();
  const bingToken = settings?.bing_verification?.trim();
  const orgJsonLd = settings
    ? {
        "@context": "https://schema.org",
        "@type": settings.schema_org_type ?? "Organization",
        name: settings.business_name ?? settings.site_name,
        url: process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
        logo: settings.logo_url ?? undefined,
        email: settings.business_email ?? undefined,
        telephone: settings.business_phone ?? undefined,
        address: settings.business_address
          ? {
              "@type": "PostalAddress",
              streetAddress: settings.business_address,
            }
          : undefined,
      }
    : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
        {gscToken && (
          <meta name="google-site-verification" content={gscToken} />
        )}
        {bingToken && <meta name="msvalidate.01" content={bingToken} />}
        {gtmId && (
          <script
            // GTM bootstrap — head injection per official GTM snippet.
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
        {orgJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
          />
        )}
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <StoreUserProvider>
            <CartProvider>
              <Analytics gaId={settings?.ga_id ?? null} />
              <div className="page-fade relative z-10">{children}</div>
              <MobileBottomNav />
              <Toaster richColors position="top-right" closeButton />
            </CartProvider>
          </StoreUserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
