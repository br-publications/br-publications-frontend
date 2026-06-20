import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/forms/projectsInternships/WebDevelopmentForm';

export const metadata: Metadata = {
    title: 'Web Dev Form',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
