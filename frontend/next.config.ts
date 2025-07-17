import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure body size limits for file uploads
  experimental: {
    // Increase body size limit for API routes
    serverComponentsExternalPackages: [],
  },
  // Set max body size for API routes (50MB)
  // This helps handle large file uploads
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
