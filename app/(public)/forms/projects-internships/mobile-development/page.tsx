import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/forms/projectsInternships/MobileDevelopmentForm';

export const metadata: Metadata = {
    title: 'Mobile Dev Form',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
