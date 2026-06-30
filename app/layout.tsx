import type { Metadata } from "next";
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

export async function generateMetadata(): Promise<Metadata> {
  const base = await getSiteMetadata();
  return {
    ...base,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/site.webmanifest",
  };
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
        description: "Jeewanom Ayurveda — Buy authentic Ayurvedic products online. Herbal supplements, immunity boosters, digestive care, skin care, hair care, churna & herbal teas delivered across India.",
        sameAs: [] as string[],
        address: settings.business_address
          ? {
              "@type": "PostalAddress",
              streetAddress: settings.business_address,
              addressCountry: "IN",
            }
          : undefined,
      }
    : null;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings?.site_name ?? "Jeewanom Ayurveda",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://jeewanom.com",
    description: "Buy authentic Ayurvedic medicines, herbal supplements, immunity boosters, digestive care, skin care & hair care products online. Trusted delivery across India.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://jeewanom.com"}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons — explicit links for Google and all browsers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3d7a6e" />

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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
