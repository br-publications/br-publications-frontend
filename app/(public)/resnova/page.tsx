import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/resnovaComponents/resnova';

export const metadata: Metadata = {
    title: 'ResNova',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
