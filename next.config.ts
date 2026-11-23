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
  experimental: {
    cpus: 4,
  },
  // Serve PDFs under the www host so Google Scholar sees them on the same host as the
  // abstract page (citation_pdf_url). Proxies to the backend; response is streamed as-is.
  // Consolidate the bare domain onto www with a 301 (canonical host for SEO / link equity).
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'brpublications.com' }],
        destination: 'https://www.brpublications.com/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'https://api2.brpublications.com';
    return [
      { source: '/files/book/:id/pdf/:pdfId', destination: `${api}/api/books/:id/pdf/:pdfId` },
      { source: '/files/bookchapter/:id/chapter/:index/pdf', destination: `${api}/api/book-chapter-publishing/:id/toc/:index/pdf` },
      { source: '/files/bookchapter/:id/toc-pdf', destination: `${api}/api/book-chapter-publishing/:id/extra-pdf/Detailed%20Table%20of%20Contents` },
    ];
  },
};

export default nextConfig;
