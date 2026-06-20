import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',        // Required for Hostinger Node.js managed hosting
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  transpilePackages: ['@mui/icons-material', '@mui/material-nextjs', '@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
