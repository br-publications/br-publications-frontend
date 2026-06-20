import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/components/contactUs';

export const metadata: Metadata = {
    title: 'Contact Us',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
