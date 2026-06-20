import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import Script from 'next/script';
import "./globals.css";
import ClientInit from "./ClientInit";
import ClientProviders from "./ClientProviders";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "BR Publications", template: "%s | BR Publications" },
  description: "Academic Books & Research Publications",
  icons: {
    icon: "/BR_logo.png",
  },
  verification: {
    google: "qOXvBk40cKzVi-OX8rO-RzYbcFkaItXCQeMzQ7SjgU4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AppRouterCacheProvider>
          <ClientInit />
          <ClientProviders>
            {children}
          </ClientProviders>
        </AppRouterCacheProvider>
        <Script src="https://cdn.jsdelivr.net/npm/citation-js/build/citation.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
