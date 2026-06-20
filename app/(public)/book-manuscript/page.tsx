import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/forms/bookManuscript';

export const metadata: Metadata = {
    title: 'Book Manuscript',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
