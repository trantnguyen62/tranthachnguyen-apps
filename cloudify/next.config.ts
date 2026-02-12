import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cloudify.app" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
