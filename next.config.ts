import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://preview-chat-d1c4db1d-7283-4394-b4a7-556a38f13684.space-z.ai",
    "http://preview-chat-d1c4db1d-7283-4394-b4a7-556a38f13684.space-z.ai",
    "preview-chat-d1c4db1d-7283-4394-b4a7-556a38f13684.space-z.ai",
  ],
};

export default nextConfig;
