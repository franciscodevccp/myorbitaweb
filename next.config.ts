import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => [
    { source: "/uploads/:path*", destination: "/api/files/:path*" },
  ],
};

export default nextConfig;
