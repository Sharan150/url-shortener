import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 'standalone' is used for Docker deployments (Render, self-hosted).
  // Vercel ignores this setting and uses its own build pipeline.
  output: 'standalone',
};

export default nextConfig;
