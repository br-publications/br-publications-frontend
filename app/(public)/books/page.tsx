import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/textBookPublications/productBooks';

export const metadata: Metadata = {
    title: 'Books',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
