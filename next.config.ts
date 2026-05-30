import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack/cache components can be heavy on some Windows setups in dev.
  // Also incompatible with some route segment configs (e.g. dynamic admin pages).
  cacheComponents: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
};

export default nextConfig;
