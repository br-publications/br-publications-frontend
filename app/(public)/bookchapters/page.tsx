import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/resnovaComponents/bookChapter';

export const metadata: Metadata = {
    title: 'Book Chapters',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
