import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  allowedDevOrigins: [
    "*.trycloudflare.com",
    "192.168.2.232",
  ],
};

export default nextConfig;