import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/forms/bookChapterManuscript';

export const metadata: Metadata = {
    title: 'Book Chapter Manuscript',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
