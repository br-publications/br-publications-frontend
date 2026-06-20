import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/ProjectsComponents/mobileAppDevelopment';

export const metadata: Metadata = {
    title: 'Mobile App Development',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
