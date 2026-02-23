import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // External packages that should not be bundled by Next.js
  serverExternalPackages: ["@azure/monitor-opentelemetry"],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  images: {
    remotePatterns: [
      { hostname: "ibben-news.s3.eu-north-1.amazonaws.com" },
      { hostname: "kb-news-content-new.s3.eu-north-1.amazonaws.com" },
      { hostname: "education-courses-images.s3.eu-north-1.amazonaws.com" },
    ],
  },
};

export default nextConfig;
