import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/layout/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Nova Store',
    template: '%s | Nova Store',  
  },
  description: 'The future of premium commerce. Find electronics, jewelery, and clothing.',
  metadataBase: new URL('http://localhost:3000'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col bg-gray-50/50">
            <Header />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
