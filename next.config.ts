import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Office scene bundles are read from disk at runtime; ship them with these routes.
  outputFileTracingIncludes: {
    "/dashboard": ["./office-studio/**/*.json"],
    "/api/office-studio/asset/[asset]": ["./office-studio/**/*.json"],
  },
  experimental:{
    serverActions:{
      bodySizeLimit: "3mb"
    }
  }
};

export default nextConfig;
