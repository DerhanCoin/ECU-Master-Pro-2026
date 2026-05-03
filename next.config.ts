import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // NOTE: Do NOT set allowedDevOrigins - it switches Next.js from "warn" mode
  // to "block" mode for cross-origin requests. In "warn" mode (when this is
  // undefined), cross-origin requests from the preview iframe still work.
  // When defined, even with the correct origins, Next.js blocks requests with
  // sec-fetch-mode: no-cors + sec-fetch-site: cross-site regardless of origin.
};

export default nextConfig;
