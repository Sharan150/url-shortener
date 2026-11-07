import type { NextConfig } from "next";

const isDocker = process.env.STANDALONE === "1" || process.env.DOCKER_BUILD === "1";

const nextConfig: NextConfig = {
  // Only use standalone output when building for Docker (Render).
  // On Vercel, omit output so Vercel creates native serverless/edge functions for dynamic routes.
  ...(isDocker ? { output: "standalone" } : {}),
};

export default nextConfig;
