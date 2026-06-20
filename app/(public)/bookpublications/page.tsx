import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/bookPublications/bookPublications';

export const metadata: Metadata = {
    title: 'Book Publications',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
