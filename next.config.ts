import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gboueajrxypybqtdxdvl.supabase.co",
        pathname: "/storage/v1/object/public/website-content/**",
      },
    ],
  },
};

export default nextConfig;
