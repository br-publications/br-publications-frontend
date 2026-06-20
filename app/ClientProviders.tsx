'use client';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <Toaster position="top-right" />
      {children}
    </HelmetProvider>
  );
}
