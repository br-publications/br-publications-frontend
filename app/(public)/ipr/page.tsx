import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/IPRComponents/ipr';

export const metadata: Metadata = {
    title: 'IPR',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
