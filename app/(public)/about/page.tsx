import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/components/aboutUs';

export const metadata: Metadata = {
    title: 'About Us',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
